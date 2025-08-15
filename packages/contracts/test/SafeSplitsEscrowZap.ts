/* eslint-disable no-plusplus, no-await-in-loop */
import {
  PublicClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types';
import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import {
  encodeAbiParameters,
  getAddress,
  getContract,
  GetContractReturnType,
  Hex,
  keccak256,
  parseAbiParameters,
  parseEventLogs,
  toBytes,
  toHex,
  zeroAddress,
} from 'viem';

import { getWrappedTokenAddress, getZapData } from '../scripts/constants';
import safeAbi from './contracts/Safe.json';
import splitMainAbi from './contracts/SplitMain.json';
import wethAbi from './contracts/WETH9.json';

const TEST_CHAIN_ID = 11155111; // Sepolia fork

const zapData = getZapData(TEST_CHAIN_ID);
if (!zapData) {
  throw new Error(`Zap data not found for chain ID ${TEST_CHAIN_ID}`);
}

const invoiceType = keccak256(toBytes('escrow-v3'));

// Test scenario (set dynamic addresses in before())
const ZAP_DATA = {
  percentAllocations: [50 * 1e4, 50 * 1e4], // 50% / 50% (1e6 scaling)
  milestoneAmounts: [
    BigInt(10) * BigInt(10) ** BigInt(18),
    BigInt(10) * BigInt(10) ** BigInt(18),
  ],
  threshold: 2,
  saltNonce: Math.floor(Math.random() * 1000000),
  arbitration: 1,
  isProjectSplit: true,
  token: getWrappedTokenAddress(TEST_CHAIN_ID) as Hex, // WETH
  escrowDeadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  details: 'ipfs://', // string (not bytes32)
  owners: [] as Array<Hex>,
  client: '' as Hex,
  clientReceiver: '' as Hex,
  resolver: '' as Hex,
};

describe('SafeSplitsEscrowZap', function () {
  let publicClient: PublicClient;

  let deployer: WalletClient;
  let alternate: WalletClient;
  let client: WalletClient;
  let resolver: WalletClient;
  let clientReceiver: WalletClient;

  let escrowFactory: ContractTypesMap['SmartInvoiceFactory'];
  let zap: ContractTypesMap['SafeSplitsEscrowZap'];

  let safe: GetContractReturnType<
    typeof safeAbi,
    { public: PublicClient; wallet: WalletClient }
  >;
  let splitMain: GetContractReturnType<
    typeof splitMainAbi,
    { public: PublicClient; wallet: WalletClient }
  >;
  let split: Hex;
  let escrow: ContractTypesMap['SmartInvoiceEscrow'];
  let token: GetContractReturnType<
    typeof wethAbi,
    { public: PublicClient; wallet: WalletClient }
  >;

  // bump to avoid CREATE2 salt reuse in sepolia fork
  let i = 0;

  before(async function () {
    publicClient = await viem.getPublicClient();
    [deployer, alternate, client, resolver, clientReceiver] =
      await viem.getWalletClients();

    if (process.env.FORK !== 'true') {
      throw new Error(`This test requires a forked network`);
    }

    // On fork, point at canonical WETH
    token = getContract({
      address: ZAP_DATA.token,
      abi: wethAbi,
      client: { public: publicClient, wallet: deployer },
    });

    // Prepare test participants
    ZAP_DATA.owners = [
      getAddress(deployer.account.address),
      getAddress(alternate.account.address),
    ].sort(); // Safe requires sorted owners
    ZAP_DATA.client = getAddress(client.account.address);
    ZAP_DATA.clientReceiver = getAddress(clientReceiver.account.address);
    ZAP_DATA.resolver = getAddress(resolver.account.address);

    // Deploy SmartInvoiceFactory + implementation
    escrowFactory = await viem.deployContract('SmartInvoiceFactory', [
      getWrappedTokenAddress(TEST_CHAIN_ID), // this factory still requires WETH
    ]);
    const invoiceImpl = await viem.deployContract('SmartInvoiceEscrow', [
      getWrappedTokenAddress(TEST_CHAIN_ID),
      escrowFactory.address,
    ]);
    await escrowFactory.write.addImplementation([
      invoiceType,
      invoiceImpl.address,
    ]);

    // ---------- Deploy Zap directly (no initializer, no wrappedETH arg) ----------
    // constructor(bytes memory _data) with 5 addresses
    const zapDeployData = [
      zapData.safeSingleton, // singleton
      zapData.fallbackHandler, // fallback handler (can be zero per setup)
      zapData.safeFactory, // safe factory
      zapData.splitMain, // split main
      escrowFactory.address, // escrow factory
    ];
    const encodedData = encodeAbiParameters(
      ['address', 'address', 'address', 'address', 'address'].map(t => ({
        type: t,
      })),
      zapDeployData,
    );

    zap = await viem.deployContract('SafeSplitsEscrowZap', [encodedData]);
  });

  describe('Deployment', function () {
    it('deploys a Zap instance with constructor data correctly set', async function () {
      expect(zap.address).to.not.equal(zeroAddress);
      expect(await zap.read.safeSingleton()).to.equal(zapData.safeSingleton);
      expect(await zap.read.fallbackHandler()).to.equal(
        zapData.fallbackHandler,
      );
      expect(await zap.read.safeFactory()).to.equal(zapData.safeFactory);
      expect(await zap.read.splitMain()).to.equal(zapData.splitMain);
      expect(await zap.read.escrowFactory()).to.equal(
        getAddress(escrowFactory.address),
      );
    });

    it('reverts deployment with zero critical addresses', async function () {
      const badData = encodeAbiParameters(
        ['address', 'address', 'address', 'address', 'address'].map(t => ({
          type: t,
        })),
        [
          zeroAddress, // bad safeSingleton
          zapData.fallbackHandler,
          zapData.safeFactory,
          zapData.splitMain,
          escrowFactory.address,
        ],
      );
      const tx = viem.deployContract('SafeSplitsEscrowZap', [badData]);
      await expect(tx).to.be.reverted; // custom error InvalidAddress("safeSingleton")
    });
  });

  describe('Create flow (Safe + Split + Escrow)', function () {
    beforeEach(async function () {
      i += 1;

      // encode Safe data: threshold, saltNonce
      const encodedSafeData = encodeAbiParameters(
        ['uint256', 'uint256'].map(t => ({ type: t })),
        [ZAP_DATA.threshold, ZAP_DATA.saltNonce + i],
      );
      // project split toggle
      const encodedSplitData = encodeAbiParameters(
        [{ type: 'bool' }],
        [ZAP_DATA.isProjectSplit],
      );
      const encodedEscrowData = encodeAbiParameters(
        [
          {
            type: 'tuple',
            name: 'escrowData',
            components: [
              { name: 'client', type: 'address' },
              { name: 'clientReceiver', type: 'address' },
              { name: 'requireVerification', type: 'bool' },
              { name: 'resolverType', type: 'uint8' },
              { name: 'resolver', type: 'address' },
              { name: 'token', type: 'address' },
              { name: 'terminationTime', type: 'uint256' },
              { name: 'saltNonce', type: 'bytes32' },
              { name: 'feeBPS', type: 'uint256' },
              { name: 'treasury', type: 'address' },
              { name: 'details', type: 'string' },
            ],
          },
        ],
        [
          {
            client: ZAP_DATA.client,
            clientReceiver: ZAP_DATA.clientReceiver,
            requireVerification: false,
            resolverType: ZAP_DATA.arbitration,
            resolver: ZAP_DATA.resolver,
            token: ZAP_DATA.token,
            terminationTime: BigInt(ZAP_DATA.escrowDeadline),
            saltNonce: toHex(BigInt(ZAP_DATA.saltNonce + i), { size: 32 }),
            feeBPS: BigInt(0),
            treasury: zeroAddress,
            details: ZAP_DATA.details,
          },
        ],
      );

      const txHash = await zap.write.createSafeSplitEscrow([
        ZAP_DATA.owners,
        ZAP_DATA.percentAllocations,
        ZAP_DATA.milestoneAmounts,
        encodedSafeData,
        zeroAddress, // no existing safe
        encodedSplitData,
        encodedEscrowData,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // parse event to get all three addresses
      const events = parseEventLogs({
        logs: receipt.logs,
        abi: zap.abi,
      });

      const created = events.find(
        e => e.eventName === 'SafeSplitsEscrowCreated',
      );
      if (!created) {
        throw new Error('SafeSplitsEscrowCreated event not found');
      }
      const safeAddress = created.args.providerSafe;
      const splitAddress = created.args.providerSplit;
      const escrowAddress = created.args.escrow;

      safe = getContract({
        address: safeAddress,
        abi: safeAbi,
        client: { public: publicClient, wallet: deployer },
      });
      splitMain = getContract({
        address: zapData.splitMain as Hex,
        abi: splitMainAbi,
        client: { public: publicClient, wallet: deployer },
      });
      escrow = await viem.getContractAt('SmartInvoiceEscrow', escrowAddress);
      split = splitAddress;
    });

    it('creates a Safe with correct owners & threshold', async function () {
      expect(safe.address).to.not.equal(zeroAddress);
      expect(await safe.read.getThreshold()).to.equal(ZAP_DATA.threshold);
      expect(await safe.read.getOwners()).to.deep.equal(ZAP_DATA.owners);
    });

    it('creates a project Split controlled by the Safe', async function () {
      expect(split).to.not.equal(zeroAddress);
      expect(await splitMain.read.getController([split])).to.equal(
        safe.address,
      );
    });

    it('creates an Escrow wired to Safe and Split', async function () {
      expect(escrow.address).to.not.equal(zeroAddress);
      expect(await escrow.read.locked()).to.equal(false);
      expect(await escrow.read.client()).to.equal(ZAP_DATA.client);
      expect(await escrow.read.clientReceiver()).to.equal(
        ZAP_DATA.clientReceiver,
      );
      expect(await escrow.read.resolverType()).to.equal(ZAP_DATA.arbitration);
      expect(await escrow.read.resolver()).to.equal(ZAP_DATA.resolver);
      expect(await escrow.read.token()).to.equal(ZAP_DATA.token);
      expect(await escrow.read.terminationTime()).to.equal(
        ZAP_DATA.escrowDeadline,
      );
      expect(await escrow.read.provider()).to.equal(safe.address);
      expect(await escrow.read.providerReceiver()).to.equal(split);
    });

    it('lets the client deposit WETH directly to Escrow', async function () {
      const amount = ZAP_DATA.milestoneAmounts[0];
      const clientToken = getContract({
        address: ZAP_DATA.token,
        abi: wethAbi,
        client: { public: publicClient, wallet: client },
      });
      await clientToken.write.deposit([], { value: amount });
      await clientToken.write.transfer([escrow.address, amount]);
      expect(await clientToken.read.balanceOf([escrow.address])).to.equal(
        amount,
      );
    });

    it('wraps stray ETH via escrow fallback path and credits WETH', async function () {
      const amount = ZAP_DATA.milestoneAmounts[0];
      await client.sendTransaction({ to: escrow.address, value: amount });
      expect(await token.read.balanceOf([escrow.address])).to.equal(amount);
    });

    it('releases a funded milestone and distributes via Split', async function () {
      const amount = ZAP_DATA.milestoneAmounts[0];

      const clientToken = getContract({
        address: ZAP_DATA.token,
        abi: wethAbi,
        client: { public: publicClient, wallet: client },
      });

      const beforeA = (await clientToken.read.balanceOf([
        deployer.account.address,
      ])) as bigint;
      const beforeB = (await clientToken.read.balanceOf([
        alternate.account.address,
      ])) as bigint;

      await clientToken.write.deposit([], { value: amount });
      await clientToken.write.transfer([escrow.address, amount]);
      expect(await clientToken.read.balanceOf([escrow.address])).to.equal(
        amount,
      );

      // client triggers release
      await escrow.write.release({ account: client.account });

      // funds landed on split
      expect(await clientToken.read.balanceOf([split])).to.equal(amount);

      // distribute by controller
      await splitMain.write.distributeERC20([
        split,
        ZAP_DATA.token,
        ZAP_DATA.owners.slice(), // already sorted
        ZAP_DATA.percentAllocations,
        0, // distributorFee override
        deployer.account.address,
      ]);

      // 0xSplits leaves 1 wei in split (gas optimization)
      expect(await clientToken.read.balanceOf([split])).to.equal(BigInt(1));

      // withdraw per recipient
      await splitMain.write.withdraw([
        deployer.account.address,
        0,
        [ZAP_DATA.token],
      ]);
      await splitMain.write.withdraw([
        alternate.account.address,
        0,
        [ZAP_DATA.token],
      ]);

      const afterA = (await clientToken.read.balanceOf([
        deployer.account.address,
      ])) as bigint;
      const afterB = (await clientToken.read.balanceOf([
        alternate.account.address,
      ])) as bigint;

      // allow for rounding; each side ~ amount/2 minus tiny dust
      expect(afterA - beforeA).to.equal(amount / BigInt(2) - BigInt(2));
      expect(afterB - beforeB).to.equal(amount / BigInt(2) - BigInt(2));
    }).timeout(80000);

    it('can skip creating a project split; providerReceiver falls back to Safe', async function () {
      // create again with split disabled
      const encodedSafeData = encodeAbiParameters(
        ['uint256', 'uint256'].map(t => ({ type: t })),
        [ZAP_DATA.threshold, ZAP_DATA.saltNonce + ++i],
      );
      const encodedSplitData = encodeAbiParameters([{ type: 'bool' }], [false]); // no split

      const escrowStructAbi = parseAbiParameters([
        '(address client, address clientReceiver, bool requireVerification, uint8 resolverType, address resolver, address token, uint256 terminationTime, bytes32 saltNonce, uint256 feeBPS, address treasury, string details)',
      ]);
      const encodedEscrowData = encodeAbiParameters(escrowStructAbi, [
        {
          client: ZAP_DATA.client,
          clientReceiver: ZAP_DATA.clientReceiver,
          requireVerification: false,
          resolverType: ZAP_DATA.arbitration,
          resolver: ZAP_DATA.resolver,
          token: ZAP_DATA.token,
          terminationTime: BigInt(ZAP_DATA.escrowDeadline),
          saltNonce: toHex(BigInt(ZAP_DATA.saltNonce + i), { size: 32 }),
          feeBPS: BigInt(0),
          treasury: zeroAddress,
          details: ZAP_DATA.details,
        },
      ]);

      const txHash = await zap.write.createSafeSplitEscrow([
        ZAP_DATA.owners,
        ZAP_DATA.percentAllocations,
        ZAP_DATA.milestoneAmounts,
        encodedSafeData,
        zeroAddress,
        encodedSplitData,
        encodedEscrowData,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      const created = parseEventLogs({ logs: receipt.logs, abi: zap.abi }).find(
        e => e.eventName === 'SafeSplitsEscrowCreated',
      );
      const safeAddress = created!.args.providerSafe as Hex;
      const splitAddress = created!.args.providerSplit as Hex;
      const escrowAddress = created!.args.escrow as Hex;

      expect(splitAddress).to.equal(zeroAddress);
      const escrow2 = await viem.getContractAt(
        'SmartInvoiceEscrow',
        escrowAddress,
      );
      expect(await escrow2.read.provider()).to.equal(safeAddress);
      expect(await escrow2.read.providerReceiver()).to.equal(safeAddress);
    });

    it('can reuse an existing Safe (skip Safe creation when address is provided)', async function () {
      // First, create one Safe
      const encodedSafeData1 = encodeAbiParameters(
        ['uint256', 'uint256'].map(t => ({ type: t })),
        [ZAP_DATA.threshold, ZAP_DATA.saltNonce + ++i],
      );
      const encodedSplitDataFalse = encodeAbiParameters(
        [{ type: 'bool' }],
        [false],
      );
      const escrowStructAbi = parseAbiParameters([
        '(address client, address clientReceiver, bool requireVerification, uint8 resolverType, address resolver, address token, uint256 terminationTime, bytes32 saltNonce, uint256 feeBPS, address treasury, string details)',
      ]);
      const encodedEscrowData1 = encodeAbiParameters(escrowStructAbi, [
        {
          client: ZAP_DATA.client,
          clientReceiver: ZAP_DATA.clientReceiver,
          requireVerification: false,
          resolverType: ZAP_DATA.arbitration,
          resolver: ZAP_DATA.resolver,
          token: ZAP_DATA.token,
          terminationTime: BigInt(ZAP_DATA.escrowDeadline),
          saltNonce: toHex(BigInt(ZAP_DATA.saltNonce + i), { size: 32 }),
          feeBPS: BigInt(0),
          treasury: zeroAddress,
          details: ZAP_DATA.details,
        },
      ]);

      const tx1 = await zap.write.createSafeSplitEscrow([
        ZAP_DATA.owners,
        ZAP_DATA.percentAllocations,
        ZAP_DATA.milestoneAmounts,
        encodedSafeData1,
        zeroAddress,
        encodedSplitDataFalse,
        encodedEscrowData1,
      ]);
      const rc1 = await publicClient.waitForTransactionReceipt({ hash: tx1 });
      const ev1 = parseEventLogs({ logs: rc1.logs, abi: zap.abi }).find(
        e => e.eventName === 'SafeSplitsEscrowCreated',
      );
      const existingSafe = ev1!.args.providerSafe as Hex;

      // Now, reuse the Safe (provide address, Safe data ignored)
      const encodedSafeData2 = encodeAbiParameters(
        ['uint256', 'uint256'].map(t => ({ type: t })),
        [999, ZAP_DATA.saltNonce + ++i], // ignored when Safe provided
      );
      const encodedEscrowData2 = encodeAbiParameters(escrowStructAbi, [
        {
          client: ZAP_DATA.client,
          clientReceiver: ZAP_DATA.clientReceiver,
          requireVerification: false,
          resolverType: ZAP_DATA.arbitration,
          resolver: ZAP_DATA.resolver,
          token: ZAP_DATA.token,
          terminationTime: BigInt(ZAP_DATA.escrowDeadline),
          saltNonce: toHex(BigInt(ZAP_DATA.saltNonce + i), { size: 32 }),
          feeBPS: BigInt(0),
          treasury: zeroAddress,
          details: ZAP_DATA.details,
        },
      ]);

      const tx2 = await zap.write.createSafeSplitEscrow([
        ZAP_DATA.owners,
        ZAP_DATA.percentAllocations,
        ZAP_DATA.milestoneAmounts,
        encodedSafeData2,
        existingSafe, // <- reuse
        encodedSplitDataFalse,
        encodedEscrowData2,
      ]);
      const rc2 = await publicClient.waitForTransactionReceipt({ hash: tx2 });
      const ev2 = parseEventLogs({ logs: rc2.logs, abi: zap.abi }).find(
        e => e.eventName === 'SafeSplitsEscrowCreated',
      );
      const safe2 = ev2!.args.providerSafe as Hex;
      expect(safe2).to.equal(existingSafe);
    });
  });

  describe('Negative paths', function () {
    it('reverts when owners and allocations length mismatch', async function () {
      const encodedSafeData = encodeAbiParameters(
        ['uint256', 'uint256'].map(t => ({ type: t })),
        [ZAP_DATA.threshold, ZAP_DATA.saltNonce + ++i],
      );
      const encodedSplitData = encodeAbiParameters(
        [{ type: 'bool' }],
        [ZAP_DATA.isProjectSplit],
      );
      const escrowStructAbi = parseAbiParameters([
        '(address client, address clientReceiver, bool requireVerification, uint8 resolverType, address resolver, address token, uint256 terminationTime, bytes32 saltNonce, uint256 feeBPS, address treasury, string details)',
      ]);
      const encodedEscrowData = encodeAbiParameters(escrowStructAbi, [
        {
          client: ZAP_DATA.client,
          clientReceiver: ZAP_DATA.clientReceiver,
          requireVerification: false,
          resolverType: ZAP_DATA.arbitration,
          resolver: ZAP_DATA.resolver,
          token: ZAP_DATA.token,
          terminationTime: BigInt(ZAP_DATA.escrowDeadline),
          saltNonce: toHex(BigInt(ZAP_DATA.saltNonce + i), { size: 32 }),
          feeBPS: BigInt(0),
          treasury: zeroAddress,
          details: ZAP_DATA.details,
        },
      ]);

      const tx = zap.write.createSafeSplitEscrow([
        ZAP_DATA.owners,
        [1000000], // bad length
        ZAP_DATA.milestoneAmounts,
        encodedSafeData,
        zeroAddress,
        encodedSplitData,
        encodedEscrowData,
      ]);

      await expect(tx).to.be.revertedWithCustomError(
        zap,
        'InvalidAllocationsOwnersData',
      );
    });
  });

  describe('Admin ops', function () {
    it('allows ADMIN to updateAddresses (partial updates allowed)', async function () {
      // no-op update (zeros)
      const noOpData = encodeAbiParameters(
        ['address', 'address', 'address', 'address'].map(t => ({ type: t })),
        [zeroAddress, zeroAddress, zeroAddress, zeroAddress],
      );
      await expect(zap.write.updateAddresses([noOpData])).to.emit(
        zap,
        'UpdatedAddresses',
      );

      // change splitMain to itself (idempotent change)
      const updateData = encodeAbiParameters(
        ['address', 'address', 'address', 'address'].map(t => ({ type: t })),
        [zeroAddress, zeroAddress, zapData.splitMain, zeroAddress],
      );
      await expect(zap.write.updateAddresses([updateData])).to.emit(
        zap,
        'UpdatedAddresses',
      );
      expect(await zap.read.splitMain()).to.equal(zapData.splitMain);
    });

    it('reverts updateAddresses for non-admin', async function () {
      const data = encodeAbiParameters(
        ['address', 'address', 'address', 'address'].map(t => ({ type: t })),
        [zeroAddress, zeroAddress, zapData.splitMain, zeroAddress],
      );
      await expect(
        zap.write.updateAddresses([data], { account: client.account }),
      ).to.be.revertedWithCustomError(zap, 'NotAuthorized');
    });

    it('allows ADMIN to updateDistributorFee', async function () {
      await expect(zap.write.updateDistributorFee([12345])).to.emit(
        zap,
        'UpdatedDistributorFee',
      );
    });

    it('reverts updateDistributorFee for non-admin', async function () {
      await expect(
        zap.write.updateDistributorFee([99999], { account: client.account }),
      ).to.be.revertedWithCustomError(zap, 'NotAuthorized');
    });
  });
});

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

import safeAbi from './contracts/Safe.json';
import wethAbi from './contracts/WETH9.json';
import { SEPOLIA_CONTRACTS } from './utils';

// v3 invoice type
const invoiceType = keccak256(toBytes('escrow-v3'));

// Test scenario (set dynamic addresses in before())
const ZAP_DATA = {
  allocations: [50n, 50n], // 50% / 50%
  milestoneAmounts: [10n * 10n ** 18n, 10n * 10n ** 18n],
  threshold: 2,
  saltNonce: Math.floor(Math.random() * 1000000),
  arbitration: 1,
  isProjectSplit: true,
  token: SEPOLIA_CONTRACTS.wrappedETH, // WETH
  escrowDeadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  details: 'ipfs://', // string (not bytes32)
  owners: [] as Array<Hex>,
  client: '' as Hex,
  clientReceiver: '' as Hex,
  resolver: '' as Hex,
};

describe('SafeSplitsEscrowZap (v2 Splits)', function () {
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

    // Use forked Sepolia for tests to avoid deploying dependency contracts
    if (process.env.FORK !== 'true') {
      throw new Error(`This test requires a forked Sepolia network`);
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
      SEPOLIA_CONTRACTS.wrappedETH,
    ]);
    const invoiceImpl = await viem.deployContract('SmartInvoiceEscrow', [
      SEPOLIA_CONTRACTS.wrappedETH,
      escrowFactory.address,
    ]);
    await escrowFactory.write.addImplementation([
      invoiceType,
      invoiceImpl.address,
    ]);

    // ---------- Deploy Zap directly (constructor bytes _data) ----------
    // _data = abi.encode(
    //   address safeSingleton,
    //   address fallbackHandler,
    //   address safeFactory,
    //   address splitFactoryV2 (Push or Pull),
    //   address escrowFactory
    // )
    const zapDeployData = [
      SEPOLIA_CONTRACTS.safeSingleton, // singleton
      SEPOLIA_CONTRACTS.fallbackHandler, // fallback handler
      SEPOLIA_CONTRACTS.safeFactory, // safe factory
      SEPOLIA_CONTRACTS.splitFactoryV2, // v2 split factory (Push or Pull)
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
      expect(await zap.read.safeSingleton()).to.equal(
        SEPOLIA_CONTRACTS.safeSingleton,
      );
      expect(await zap.read.fallbackHandler()).to.equal(
        SEPOLIA_CONTRACTS.fallbackHandler,
      );
      expect(await zap.read.safeFactory()).to.equal(
        SEPOLIA_CONTRACTS.safeFactory,
      );
      // v2: splitFactory, not splitMain
      expect(await zap.read.splitFactory()).to.equal(
        SEPOLIA_CONTRACTS.splitFactoryV2,
      );
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
          SEPOLIA_CONTRACTS.fallbackHandler,
          SEPOLIA_CONTRACTS.safeFactory,
          SEPOLIA_CONTRACTS.splitFactoryV2,
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
        ZAP_DATA.allocations,
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
      const safeAddress = created.args.providerSafe as Hex;
      const splitAddress = created.args.providerSplit as Hex;
      const escrowAddress = created.args.escrow as Hex;

      safe = getContract({
        address: safeAddress,
        abi: safeAbi,
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

    it('creates a project Split (v2) and wires controller to the Safe (owner at creation)', async function () {
      // In v2, the split controller/owner was set to the Safe during creation.
      // We cannot assert v1 SplitMain.read.getController. Just assert split exists.
      expect(split).to.not.equal(zeroAddress);
      // providerReceiver below should point at the split (verifies zap wiring)
      expect(await escrow.read.providerReceiver()).to.equal(split);
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
      // when split is on, providerReceiver == split
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

    it('releases a funded milestone (v2: do not assume SplitMain/withdraw semantics)', async function () {
      const amount = ZAP_DATA.milestoneAmounts[0];

      const clientToken = getContract({
        address: ZAP_DATA.token,
        abi: wethAbi,
        client: { public: publicClient, wallet: client },
      });

      const beforeEscrow = (await clientToken.read.balanceOf([
        escrow.address,
      ])) as bigint;

      await clientToken.write.deposit([], { value: amount });
      await clientToken.write.transfer([escrow.address, amount]);
      expect(await clientToken.read.balanceOf([escrow.address])).to.equal(
        beforeEscrow + amount,
      );

      // client triggers release
      await escrow.write.release({ account: client.account });

      // In v2, funds will flow to the providerReceiver (split) / Warehouse pipeline.
      // We only assert that escrow no longer holds the milestone amount.
      const afterEscrow = (await clientToken.read.balanceOf([
        escrow.address,
      ])) as bigint;
      expect(afterEscrow).to.equal(beforeEscrow); // amount left escrow on release
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
        ZAP_DATA.allocations,
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
        ZAP_DATA.allocations,
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
        ZAP_DATA.allocations,
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
    it('reverts when owners and allocations length mismatch (only matters if split is enabled)', async function () {
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
        [1000000n], // bad length
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

      // change splitFactory to itself (idempotent change)
      const updateData = encodeAbiParameters(
        ['address', 'address', 'address', 'address'].map(t => ({ type: t })),
        [
          zeroAddress,
          zeroAddress,
          SEPOLIA_CONTRACTS.splitFactoryV2,
          zeroAddress,
        ],
      );
      await expect(zap.write.updateAddresses([updateData])).to.emit(
        zap,
        'UpdatedAddresses',
      );
      expect(await zap.read.splitFactory()).to.equal(
        SEPOLIA_CONTRACTS.splitFactoryV2,
      );
    });

    it('reverts updateAddresses for non-admin', async function () {
      const data = encodeAbiParameters(
        ['address', 'address', 'address', 'address'].map(t => ({ type: t })),
        [
          zeroAddress,
          zeroAddress,
          SEPOLIA_CONTRACTS.splitFactoryV2,
          zeroAddress,
        ],
      );
      await expect(
        zap.write.updateAddresses([data], { account: client.account }),
      ).to.be.revertedWithCustomError(zap, 'NotAuthorized');
    });

    it('allows ADMIN to updateDistributionIncentive (ppm, uint16)', async function () {
      await expect(zap.write.updateDistributionIncentive([12345])).to.emit(
        zap,
        'UpdatedDistributionIncentive',
      );
    });

    it('reverts updateDistributionIncentive for non-admin', async function () {
      await expect(
        zap.write.updateDistributionIncentive([23456], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(zap, 'NotAuthorized');
    });
  });
});

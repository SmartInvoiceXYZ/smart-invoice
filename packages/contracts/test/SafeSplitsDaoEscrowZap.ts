/* eslint-disable no-plusplus */
import {
  PublicClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types';
import { expect } from 'chai';
import { viem } from 'hardhat';
import { ArtifactsMap, ContractTypesMap } from 'hardhat/types';
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

// ---------------------------------------------------------------------------
// Constants / shared scaffolding
// ---------------------------------------------------------------------------

const invoiceType = keccak256(toBytes('escrow-v3'));

const DAO_CONFIG = { spoilsBPS: 1_000 }; // 10%

// Base per-test config (mutable copy is made per context)
const BASE_ZAP_DATA = {
  allocations: [50n, 50n], // 50:50
  milestoneAmounts: [10n * 10n ** 18n, 10n * 10n ** 18n],
  threshold: 2n,
  saltNonce: Math.floor(Math.random() * 1000),
  arbitration: 1,
  isDaoSplit: true,
  isProjectSplit: true,
  token: SEPOLIA_CONTRACTS.wrappedETH,
  escrowDeadline: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  details: 'ipfs://',
  owners: [] as Array<Hex>,
  client: '' as Hex,
  clientReceiver: '' as Hex,
  resolver: '' as Hex,
};

const nextSalt = (() => {
  let i = 0;
  return () => ++i;
})();

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('SafeSplitsDaoEscrowZap (forked Sepolia)', function () {
  let publicClient: PublicClient;
  let deployer: WalletClient;
  let alternate: WalletClient;
  let client: WalletClient;
  let clientReceiver: WalletClient;
  let resolver: WalletClient;
  let dao: WalletClient;
  let daoTreasury: WalletClient;

  let escrowFactory: ContractTypesMap['SmartInvoiceFactory'];

  // Helpers that multiple contexts use

  const encodeSafeData = (threshold: bigint, salt: number) =>
    encodeAbiParameters(
      [{ type: 'uint256' }, { type: 'uint256' }],
      [threshold, BigInt(salt)],
    );

  const encodeSplitFlags = (
    createProjectSplit: boolean,
    createDaoSplit: boolean,
  ) =>
    encodeAbiParameters(
      [{ type: 'bool' }, { type: 'bool' }],
      [createProjectSplit, createDaoSplit],
    );

  const encodeEscrowData = (z: typeof BASE_ZAP_DATA, salt: number) => {
    const escrowStructAbi = parseAbiParameters([
      '(address client, address clientReceiver, bool requireVerification, uint8 resolverType, address resolver, address token, uint256 terminationTime, bytes32 saltNonce, uint256 feeBPS, address treasury, string details)',
    ]);
    return encodeAbiParameters(escrowStructAbi, [
      {
        client: z.client,
        clientReceiver: z.clientReceiver,
        requireVerification: false,
        resolverType: z.arbitration,
        resolver: z.resolver,
        token: z.token,
        terminationTime: BigInt(z.escrowDeadline),
        saltNonce: toHex(BigInt(salt), { size: 32 }),
        feeBPS: 0n,
        treasury: zeroAddress,
        details: z.details,
      },
    ]);
  };

  const parseCreatedEvent = (
    receipt: Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>>,
    abi: ArtifactsMap['SafeSplitsDaoEscrowZap']['abi'],
  ) => {
    const events = parseEventLogs({ logs: receipt.logs, abi });
    const created = events.find(
      e => e.eventName === 'SafeSplitsDaoEscrowCreated',
    );
    if (!created) throw new Error('SafeSplitsDaoEscrowCreated event not found');
    return created.args;
  };

  const deployZap = async (spoilsBPS: number) => {
    const configBytes = encodeAbiParameters(
      [
        { type: 'address' }, // safeSingleton
        { type: 'address' }, // fallbackHandler
        { type: 'address' }, // safeFactory
        { type: 'address' }, // splitFactoryV2  <-- v2 factory (Push/Pull)
        { type: 'address' }, // escrowFactory
        { type: 'address' }, // dao
        { type: 'address' }, // daoReceiver
        { type: 'uint16' }, // spoilsBPS
      ],
      [
        SEPOLIA_CONTRACTS.safeSingleton,
        SEPOLIA_CONTRACTS.fallbackHandler,
        SEPOLIA_CONTRACTS.safeFactory,
        SEPOLIA_CONTRACTS.splitFactoryV2, // <-- updated
        escrowFactory.address,
        getAddress(dao.account.address),
        getAddress(daoTreasury.account.address),
        spoilsBPS,
      ],
    );
    return viem.deployContract('SafeSplitsDaoEscrowZap', [configBytes]);
  };

  // -------------------------------------------------------------------------
  // Global bootstrapping: network + common contracts
  // -------------------------------------------------------------------------

  before(async function () {
    // Use forked Sepolia for tests to avoid deploying dependency contracts
    if (process.env.FORK !== 'true') {
      throw new Error(
        `This test requires a forked Sepolia network (FORK=true)`,
      );
    }

    publicClient = await viem.getPublicClient();
    [deployer, alternate, client, clientReceiver, resolver, dao, daoTreasury] =
      await viem.getWalletClients();

    // Deploy core invoice infra (shared for all contexts)
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
  });

  // -------------------------------------------------------------------------
  // Deployment & config
  // -------------------------------------------------------------------------

  describe('Deployment', function () {
    let zap: ContractTypesMap['SafeSplitsDaoEscrowZap'];

    before(async function () {
      zap = await deployZap(DAO_CONFIG.spoilsBPS);
      expect(zap.address).to.not.equal(zeroAddress);
    });

    it('deploys a Zap instance with DAO config', async function () {
      expect(await zap.read.safeSingleton()).to.equal(
        getAddress(SEPOLIA_CONTRACTS.safeSingleton),
      );
      expect(await zap.read.safeFactory()).to.equal(
        getAddress(SEPOLIA_CONTRACTS.safeFactory),
      );
      // v2: splitFactory (not splitMain)
      expect(await zap.read.splitFactory()).to.equal(
        getAddress(SEPOLIA_CONTRACTS.splitFactoryV2),
      );
      expect(await zap.read.escrowFactory()).to.equal(
        getAddress(escrowFactory.address),
      );
      expect(await zap.read.dao()).to.equal(getAddress(dao.account.address));
      expect(await zap.read.daoReceiver()).to.equal(
        getAddress(daoTreasury.account.address),
      );
      expect(await zap.read.spoilsBPS()).to.equal(BigInt(DAO_CONFIG.spoilsBPS));
    });

    it('reverts zap deployment if dao is zero', async function () {
      const bytesBadDao = encodeAbiParameters(
        [
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'uint16' },
        ],
        [
          SEPOLIA_CONTRACTS.safeSingleton,
          SEPOLIA_CONTRACTS.fallbackHandler,
          SEPOLIA_CONTRACTS.safeFactory,
          SEPOLIA_CONTRACTS.splitFactoryV2,
          escrowFactory.address,
          zeroAddress, // bad dao
          getAddress(daoTreasury.account.address),
          DAO_CONFIG.spoilsBPS,
        ],
      );
      await expect(viem.deployContract('SafeSplitsDaoEscrowZap', [bytesBadDao]))
        .to.be.reverted;
    });

    it('reverts zap deployment if daoReceiver is zero', async function () {
      const bytesBadTreasury = encodeAbiParameters(
        [
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'uint16' },
        ],
        [
          SEPOLIA_CONTRACTS.safeSingleton,
          SEPOLIA_CONTRACTS.fallbackHandler,
          SEPOLIA_CONTRACTS.safeFactory,
          SEPOLIA_CONTRACTS.splitFactoryV2,
          escrowFactory.address,
          getAddress(dao.account.address),
          zeroAddress, // bad receiver
          DAO_CONFIG.spoilsBPS,
        ],
      );
      await expect(
        viem.deployContract('SafeSplitsDaoEscrowZap', [bytesBadTreasury]),
      ).to.be.reverted;
    });

    it('reverts zap deployment if spoilsBPS > 10_000', async function () {
      const bytesTooHigh = encodeAbiParameters(
        [
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'address' },
          { type: 'uint16' },
        ],
        [
          SEPOLIA_CONTRACTS.safeSingleton,
          SEPOLIA_CONTRACTS.fallbackHandler,
          SEPOLIA_CONTRACTS.safeFactory,
          SEPOLIA_CONTRACTS.splitFactoryV2,
          escrowFactory.address,
          getAddress(dao.account.address),
          getAddress(daoTreasury.account.address),
          10_001, // invalid
        ],
      );
      await expect(
        viem.deployContract('SafeSplitsDaoEscrowZap', [bytesTooHigh]),
      ).to.be.reverted;
    });

    it('reverts DAO split creation when spoilsBPS == 0 (but zap deploys fine)', async function () {
      const zeroBpsZap = await deployZap(0); // allowed to deploy
      const salt = BASE_ZAP_DATA.saltNonce + 9999;
      const safeData = encodeSafeData(BASE_ZAP_DATA.threshold, salt);
      const splitsFlags = encodeSplitFlags(true, true);
      const escrowData = encodeEscrowData(
        {
          ...BASE_ZAP_DATA,
          client: getAddress(client.account.address),
          clientReceiver: getAddress(clientReceiver.account.address),
          resolver: getAddress(resolver.account.address),
        },
        salt,
      );

      await expect(
        zeroBpsZap.write.createSafeSplitEscrow([
          [
            getAddress(deployer.account.address),
            getAddress(alternate.account.address),
          ].sort(),
          BASE_ZAP_DATA.allocations,
          BASE_ZAP_DATA.milestoneAmounts,
          safeData,
          zeroAddress,
          splitsFlags,
          escrowData,
        ]),
      ).to.be.reverted;
    });
  });

  // -------------------------------------------------------------------------
  // Happy-path flow (creates new Safe + team split + DAO split + escrow)
  // -------------------------------------------------------------------------

  describe('Happy path: project split + DAO split', function () {
    let zap: ContractTypesMap['SafeSplitsDaoEscrowZap'];
    let token: GetContractReturnType<
      typeof wethAbi,
      { public: PublicClient; wallet: WalletClient }
    >;

    // Created per-test via beforeEach
    const ZAP_DATA = { ...BASE_ZAP_DATA };
    let safe: GetContractReturnType<
      typeof safeAbi,
      { public: PublicClient; wallet: WalletClient }
    >;
    let teamSplit: Hex;
    let daoSplit: Hex;
    let escrow: ContractTypesMap['SmartInvoiceEscrow'];

    before(async function () {
      // role wiring once for the context
      ZAP_DATA.owners = [
        getAddress(deployer.account.address),
        getAddress(alternate.account.address),
      ].sort();
      ZAP_DATA.client = getAddress(client.account.address);
      ZAP_DATA.clientReceiver = getAddress(clientReceiver.account.address);
      ZAP_DATA.resolver = getAddress(resolver.account.address);

      token = getContract({
        address: ZAP_DATA.token,
        abi: wethAbi,
        client: { public: publicClient, wallet: deployer },
      });

      zap = await deployZap(DAO_CONFIG.spoilsBPS);
    });

    beforeEach(async function () {
      const salt = ZAP_DATA.saltNonce + nextSalt();

      const encodedSafeData = encodeSafeData(ZAP_DATA.threshold, salt);
      const encodedSplitData = encodeSplitFlags(true, true); // project + dao
      const encodedEscrowData = encodeEscrowData(ZAP_DATA, salt);

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
      const args = parseCreatedEvent(receipt, zap.abi);

      safe = getContract({
        address: args.providerSafe,
        abi: safeAbi,
        client: { public: publicClient, wallet: deployer },
      });

      escrow = await viem.getContractAt('SmartInvoiceEscrow', args.escrow);
      teamSplit = args.providerSplit;
      daoSplit = args.daoSplit;
    });

    it('creates a Safe', async function () {
      expect(safe.address).to.not.equal(zeroAddress);
      expect(await safe.read.getThreshold()).to.equal(ZAP_DATA.threshold);
      expect(await safe.read.getOwners()).to.deep.equal(ZAP_DATA.owners);
    });

    it('creates a project team Split (address present)', async function () {
      expect(teamSplit).to.not.equal(zeroAddress);
    });

    it('creates a DAO Split (address present)', async function () {
      expect(daoSplit).to.not.equal(zeroAddress);
    });

    it('creates an Escrow with (provider=dao, providerReceiver=daoSplit) when DAO split is created', async function () {
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
      expect(await escrow.read.provider()).to.equal(
        getAddress(dao.account.address),
      );
      expect(await escrow.read.providerReceiver()).to.equal(daoSplit);
    });

    it('allows client to deposit ERC20 into Escrow', async function () {
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

    it('wraps stray ETH sent to Escrow via fallback', async function () {
      const amount = ZAP_DATA.milestoneAmounts[0];
      await client.sendTransaction({ to: escrow.address, value: amount });
      expect(await token.read.balanceOf([escrow.address])).to.equal(amount);
    });

    it('releases milestone and funds leave the escrow', async function () {
      const amount = ZAP_DATA.milestoneAmounts[0];

      const clientToken = getContract({
        address: ZAP_DATA.token,
        abi: wethAbi,
        client: { public: publicClient, wallet: client },
      });

      // Fund escrow
      await clientToken.write.deposit([], { value: amount });
      await clientToken.write.transfer([escrow.address, amount]);
      const before = (await clientToken.read.balanceOf([
        escrow.address,
      ])) as bigint;
      expect(before).to.equal(amount);

      // Release (v3 escrow: no args)
      await escrow.write.release({ account: client.account });

      // In Splits v2, tokens won’t sit on the split address; just assert they left the escrow.
      const after = (await clientToken.read.balanceOf([
        escrow.address,
      ])) as bigint;
      expect(after).to.equal(0n);
    }).timeout(90_000);
  });

  // -------------------------------------------------------------------------
  // Optional-path variants
  // -------------------------------------------------------------------------

  describe('Optional path: use an existing Safe', function () {
    let zap: ContractTypesMap['SafeSplitsDaoEscrowZap'];
    const ZAP_DATA = { ...BASE_ZAP_DATA };
    let encodedSafeData: Hex;

    before(async function () {
      ZAP_DATA.owners = [
        getAddress(deployer.account.address),
        getAddress(alternate.account.address),
      ].sort();
      ZAP_DATA.client = getAddress(client.account.address);
      ZAP_DATA.clientReceiver = getAddress(clientReceiver.account.address);
      ZAP_DATA.resolver = getAddress(resolver.account.address);

      zap = await deployZap(DAO_CONFIG.spoilsBPS);
    });

    it('skips Safe deployment when an existing Safe address is provided', async function () {
      const salt = ZAP_DATA.saltNonce + 200 * nextSalt();
      encodedSafeData = encodeSafeData(ZAP_DATA.threshold, salt);

      const localEscrowData = encodeEscrowData(ZAP_DATA, salt);

      const txHash = await zap.write.createSafeSplitEscrow([
        ZAP_DATA.owners,
        ZAP_DATA.allocations,
        ZAP_DATA.milestoneAmounts,
        encodedSafeData,
        getAddress(deployer.account.address), // supply an existing Safe (EOA accepted by contract)
        encodeSplitFlags(true, true),
        localEscrowData,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const args = parseCreatedEvent(receipt, zap.abi);

      expect(args.providerSafe).to.equal(getAddress(deployer.account.address));
    });
  });

  describe('Optional path: projectSplit=false (providerReceiver becomes Safe)', function () {
    let zap: ContractTypesMap['SafeSplitsDaoEscrowZap'];
    const ZAP_DATA = { ...BASE_ZAP_DATA };

    before(async function () {
      ZAP_DATA.owners = [
        getAddress(deployer.account.address),
        getAddress(alternate.account.address),
      ].sort();
      ZAP_DATA.client = getAddress(client.account.address);
      ZAP_DATA.clientReceiver = getAddress(clientReceiver.account.address);
      ZAP_DATA.resolver = getAddress(resolver.account.address);

      zap = await deployZap(DAO_CONFIG.spoilsBPS);
    });

    it('uses Safe as providerReceiver when createProjectSplit=false', async function () {
      const salt = ZAP_DATA.saltNonce + 100 * nextSalt();

      const txHash = await zap.write.createSafeSplitEscrow([
        ZAP_DATA.owners,
        ZAP_DATA.allocations,
        ZAP_DATA.milestoneAmounts,
        encodeSafeData(ZAP_DATA.threshold, salt),
        zeroAddress,
        encodeSplitFlags(false, true), // project=false, dao=true
        encodeEscrowData(ZAP_DATA, salt),
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const args = parseCreatedEvent(receipt, zap.abi);

      expect(args.providerSplit).to.equal(args.providerSafe);
    });
  });

  describe('Optional path: daoSplit=false (provider = Safe, providerReceiver = teamSplit)', function () {
    let zap: ContractTypesMap['SafeSplitsDaoEscrowZap'];
    const ZAP_DATA = { ...BASE_ZAP_DATA };

    before(async function () {
      ZAP_DATA.owners = [
        getAddress(deployer.account.address),
        getAddress(alternate.account.address),
      ].sort();
      ZAP_DATA.client = getAddress(client.account.address);
      ZAP_DATA.clientReceiver = getAddress(clientReceiver.account.address);
      ZAP_DATA.resolver = getAddress(resolver.account.address);

      zap = await deployZap(DAO_CONFIG.spoilsBPS);
    });

    it('skips DAO split when createDaoSplit=false', async function () {
      const salt = ZAP_DATA.saltNonce + 300 * nextSalt();

      const txHash = await zap.write.createSafeSplitEscrow([
        ZAP_DATA.owners,
        ZAP_DATA.allocations,
        ZAP_DATA.milestoneAmounts,
        encodeSafeData(ZAP_DATA.threshold, salt),
        zeroAddress,
        encodeSplitFlags(true, false), // project=true, dao=false
        encodeEscrowData(ZAP_DATA, salt),
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const args = parseCreatedEvent(receipt, zap.abi);

      expect(args.daoSplit).to.equal(zeroAddress);

      const inv = await viem.getContractAt('SmartInvoiceEscrow', args.escrow);
      expect(await inv.read.provider()).to.equal(args.providerSafe);
      expect(await inv.read.providerReceiver()).to.equal(args.providerSplit);
    });
  });

  // -------------------------------------------------------------------------
  // Input validation & revert cases
  // -------------------------------------------------------------------------

  describe('Input validation', function () {
    let zap: ContractTypesMap['SafeSplitsDaoEscrowZap'];
    const ZAP_DATA = { ...BASE_ZAP_DATA };
    let encodedSafeData: Hex;
    let encodedSplitData: Hex;

    before(async function () {
      ZAP_DATA.owners = [
        getAddress(deployer.account.address),
        getAddress(alternate.account.address),
      ].sort();
      ZAP_DATA.client = getAddress(client.account.address);
      ZAP_DATA.clientReceiver = getAddress(clientReceiver.account.address);
      ZAP_DATA.resolver = getAddress(resolver.account.address);

      zap = await deployZap(DAO_CONFIG.spoilsBPS);

      const salt = ZAP_DATA.saltNonce + nextSalt();
      encodedSafeData = encodeSafeData(ZAP_DATA.threshold, salt);
      encodedSplitData = encodeSplitFlags(
        ZAP_DATA.isProjectSplit,
        ZAP_DATA.isDaoSplit,
      );
    });

    it('reverts when owners & allocations length mismatch (split enabled)', async function () {
      const badAlloc = [100n]; // only one allocation
      const escrowData = encodeEscrowData(ZAP_DATA, ZAP_DATA.saltNonce + 4242);

      await expect(
        zap.write.createSafeSplitEscrow([
          ZAP_DATA.owners,
          badAlloc,
          ZAP_DATA.milestoneAmounts,
          encodedSafeData,
          zeroAddress,
          encodedSplitData,
          escrowData,
        ]),
      ).to.be.reverted;
    });
  });
});

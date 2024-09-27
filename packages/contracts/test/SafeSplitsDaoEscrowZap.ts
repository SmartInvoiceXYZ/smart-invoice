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
  parseEventLogs,
  toBytes,
  toHex,
  zeroAddress,
} from 'viem';

import {
  getFactory,
  getWrappedTokenAddress,
  getZapData,
} from '../scripts/constants';
import safeAbi from './contracts/Safe.json';
import splitMainAbi from './contracts/SplitMain.json';
import wethAbi from './contracts/WETH9.json';
import { currentTimestamp } from './utils';

const formatBytes32String = (str: string) => toHex(toBytes(str, { size: 32 }));

// Use forked Sepolia for tests to avoid deploying dependency contracts
const TEST_CHAIN_ID = 11155111;

const zapData = getZapData(TEST_CHAIN_ID);

if (!zapData) {
  throw new Error(`Zap data not found for chain ID ${TEST_CHAIN_ID}`);
}

// Set `owners` (sorted), `client`, and `resolver` in before
const ZAP_DATA = {
  percentAllocations: [50 * 1e4, 50 * 1e4], // raid party split percent allocations
  milestoneAmounts: [
    BigInt(10) * BigInt(10) ** BigInt(18),
    BigInt(10) * BigInt(10) ** BigInt(18),
  ], // escrow milestone amounts
  threshold: 2, // threshold
  saltNonce: Math.floor(new Date().getTime() / 1000), // salt nonce
  arbitration: 1,
  isDaoSplit: true,
  isProjectSplit: true,
  token: getWrappedTokenAddress(TEST_CHAIN_ID) as Hex,
  escrowDeadline: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
  details: formatBytes32String('ipfs://'),
  fallbackHandler: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
  owners: [] as Array<Hex>,
  client: '' as Hex,
  resolver: '' as Hex,
};

describe('SafeSplitsDaoEscrowZap', function () {
  let publicClient: PublicClient;
  let deployer: WalletClient;
  let alternate: WalletClient;
  let client: WalletClient;
  let resolver: WalletClient;
  let receiver: WalletClient;
  let dao: WalletClient;
  let factory: ContractTypesMap['SafeSplitsEscrowZapFactory'];
  let implementation: ContractTypesMap['SafeSplitsDaoEscrowZap'];
  let zap: ContractTypesMap['SafeSplitsDaoEscrowZap'];
  let safe: GetContractReturnType<
    typeof safeAbi,
    { public: PublicClient; wallet: WalletClient }
  >;
  let spoilsManager: ContractTypesMap['SpoilsManager'];
  let splitMain: GetContractReturnType<
    typeof splitMainAbi,
    { public: PublicClient; wallet: WalletClient }
  >;
  let teamSplit: Hex;
  let daoSplit: Hex;
  let daoReceiver: Hex;
  let escrow: ContractTypesMap['SmartInvoiceUpdatable'];
  let token: GetContractReturnType<
    typeof wethAbi,
    { public: PublicClient; wallet: WalletClient }
  >;
  let encodedSafeData: Hex;
  let encodedSplitData: Hex;
  let i = 0;

  before(async function () {
    publicClient = await viem.getPublicClient();
    [deployer, alternate, client, resolver, receiver, dao] =
      await viem.getWalletClients();
    token = getContract({
      address: ZAP_DATA.token,
      abi: wethAbi,
      client: {
        public: await viem.getPublicClient(),
        wallet: deployer,
      },
    });

    ZAP_DATA.owners = [
      getAddress(deployer.account.address),
      getAddress(alternate.account.address),
    ].sort();
    ZAP_DATA.client = getAddress(client.account.address);
    ZAP_DATA.resolver = getAddress(resolver.account.address);

    zapData.dao = getAddress(dao.account.address);

    const spoilsValues = {
      spoils: 10, // out of 100
      receiver: getAddress(receiver.account.address),
      newOwner: zapData.dao,
      percentageScale: 1e4,
    };

    // Deploy Spoils Manager
    spoilsManager = (await viem.deployContract(
      'SpoilsManager',
    )) as ContractTypesMap['SpoilsManager'];

    expect(spoilsManager).to.not.equal(null);
    expect(spoilsManager.address).to.not.equal(zeroAddress);

    const spoilsManagerFactory = (await viem.deployContract(
      'SpoilsManagerFactory',
      [spoilsManager.address],
    )) as ContractTypesMap['SpoilsManagerFactory'];
    expect(spoilsManagerFactory.address).to.not.equal(zeroAddress);

    const spoilsManagerReceipt =
      await spoilsManagerFactory.write.createSpoilsManager([
        spoilsValues.spoils,
        spoilsValues.percentageScale,
        spoilsValues.receiver,
        spoilsValues.newOwner,
        formatBytes32String(String(currentTimestamp())),
      ]);
    const spoilsManagerDeploy = await publicClient.waitForTransactionReceipt({
      hash: spoilsManagerReceipt,
    });
    const spoilsManagerAddress = spoilsManagerDeploy.logs[0].address;
    spoilsManager = (await viem.getContractAt(
      'SpoilsManager',
      spoilsManagerAddress,
    )) as ContractTypesMap['SpoilsManager'];
    expect(spoilsManager.address).to.not.equal(zeroAddress);

    // Deploy Zap Implementation
    implementation = (await viem.deployContract(
      'SafeSplitsDaoEscrowZap',
    )) as ContractTypesMap['SafeSplitsDaoEscrowZap'];
    expect(implementation.address).to.not.equal(zeroAddress);

    // Deploy Zap Factory
    factory = (await viem.deployContract('SafeSplitsEscrowZapFactory', [
      implementation.address,
    ])) as ContractTypesMap['SafeSplitsEscrowZapFactory'];
    expect(factory.address).to.not.equal(zeroAddress);

    // Deploy Zap Instance
    const zapDeployData = [
      zapData.safeSingleton, // singleton
      zapData.fallbackHandler, // fallback handler
      zapData.safeFactory, // safe factory
      zapData.splitMain, // split main
      spoilsManager.address, // spoils manager
      getFactory(TEST_CHAIN_ID), // escrow factory
      getWrappedTokenAddress(TEST_CHAIN_ID), // wrapped token
      zapData.dao, // dao
    ];
    const encodedData = encodeAbiParameters(
      [
        'address',
        'address',
        'address',
        'address',
        'address',
        'address',
        'address',
        'address',
      ].map(t => ({ type: t })),
      zapDeployData,
    );
    const hash = await factory.write.createSafeSplitsEscrowZap([
      encodedData,
      formatBytes32String(String(ZAP_DATA.saltNonce)),
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const zapAddress = receipt.logs[0].address;
    zap = (await viem.getContractAt(
      'SafeSplitsDaoEscrowZap',
      zapAddress,
    )) as ContractTypesMap['SafeSplitsDaoEscrowZap'];
  });

  beforeEach(async function () {
    i += 1; // increment to avoid nonce collisions in Create2 deployments

    // Create with zap
    encodedSafeData = encodeAbiParameters(
      ['uint256', 'uint256'].map(t => ({ type: t })),
      [ZAP_DATA.threshold, ZAP_DATA.saltNonce + i],
    );
    encodedSplitData = encodeAbiParameters(
      [{ type: 'bool' }, { type: 'bool' }],
      [ZAP_DATA.isProjectSplit, ZAP_DATA.isDaoSplit],
    );
    const encodedEscrowData = encodeAbiParameters(
      [
        'address',
        'uint32',
        'address',
        'address',
        'uint256',
        'uint256',
        'bytes32',
      ].map(t => ({ type: t })),
      [
        ZAP_DATA.client,
        ZAP_DATA.arbitration,
        ZAP_DATA.resolver,
        ZAP_DATA.token,
        ZAP_DATA.escrowDeadline,
        ZAP_DATA.saltNonce + i,
        ZAP_DATA.details,
      ],
    );

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
    const events = parseEventLogs({
      logs: receipt.logs,
      abi: zap.abi,
    });

    const zapCreatedEvent = events.find(
      e => e.eventName === 'SafeSplitsDaoEscrowCreated',
    );
    if (!zapCreatedEvent) {
      throw new Error('SafeSplitsDaoEscrowCreated event not found');
    }
    const safeAddress = zapCreatedEvent.args.safe;
    const teamSplitAddress = zapCreatedEvent.args.projectTeamSplit;
    const daoSplitAddress = zapCreatedEvent.args.daoSplit;
    const escrowAddress = zapCreatedEvent.args.escrow;

    safe = getContract({
      address: safeAddress,
      abi: safeAbi,
      client: {
        public: publicClient,
        wallet: deployer,
      },
    });
    splitMain = getContract({
      address: zapData.splitMain as Hex,
      abi: splitMainAbi,
      client: { public: publicClient, wallet: deployer },
    });
    escrow = (await viem.getContractAt(
      'SmartInvoiceUpdatable',
      escrowAddress,
    )) as ContractTypesMap['SmartInvoiceUpdatable'];
    daoReceiver = await spoilsManager.read.receiver();
    teamSplit = teamSplitAddress;
    daoSplit = daoSplitAddress;
  });

  it('Should deploy a SpoilsManager instance', async function () {
    expect(spoilsManager.address).to.not.equal(zeroAddress);
    expect(await spoilsManager.read.spoils()).to.equal(10);
    expect(await spoilsManager.read.receiver()).to.equal(
      getAddress(receiver.account.address),
    );
    expect(await spoilsManager.read.owner()).to.equal(
      getAddress(dao.account.address),
    );
  });

  it('Should deploy a Zap instance', async function () {
    expect(zap.address).to.not.equal(zeroAddress);
    expect(await zap.read.safeSingleton()).to.equal(
      getAddress(zapData.safeSingleton as Hex),
    );
    expect(await zap.read.safeFactory()).to.equal(
      getAddress(zapData.safeFactory as Hex),
    );
    expect(await zap.read.splitMain()).to.equal(
      getAddress(zapData.splitMain as Hex),
    );
    expect(await zap.read.spoilsManager()).to.equal(
      getAddress(spoilsManager.address),
    );
    expect(await zap.read.escrowFactory()).to.equal(getFactory(TEST_CHAIN_ID));
    expect(await zap.read.wrappedNativeToken()).to.equal(
      getWrappedTokenAddress(TEST_CHAIN_ID),
    );
  });

  it('Should create a Safe', async function () {
    expect(safe.address).to.not.equal(zeroAddress);
    expect(await safe.read.getThreshold()).to.equal(ZAP_DATA.threshold);
    expect(await safe.read.getOwners()).to.deep.equal(ZAP_DATA.owners);
  });

  it('Should create a project team Split', async function () {
    expect(teamSplit).to.not.equal(zeroAddress);
    expect(await splitMain.read.getController([teamSplit])).to.equal(
      safe.address,
    );
  });

  it('Should create a dao Split', async function () {
    expect(daoSplit).to.not.equal(zeroAddress);
    expect(await splitMain.read.getController([daoSplit])).to.equal(
      zapData.dao,
    );
  });

  it('Should create an Escrow', async function () {
    expect(escrow.address).to.not.equal(zeroAddress);
    expect(await escrow.read.locked()).to.equal(false);
    expect(await escrow.read.client()).to.equal(ZAP_DATA.client);
    expect(await escrow.read.resolverType()).to.equal(ZAP_DATA.arbitration);
    expect(await escrow.read.resolver()).to.equal(ZAP_DATA.resolver);
    expect(await escrow.read.token()).to.equal(ZAP_DATA.token);
    expect(await escrow.read.terminationTime()).to.equal(
      ZAP_DATA.escrowDeadline,
    );
    expect(await escrow.read.details()).to.equal(ZAP_DATA.details);
    expect(await escrow.read.providerReceiver()).to.equal(daoSplit);
    expect(await escrow.read.provider()).to.equal(zapData.dao);
  });

  it('Should let the client deposit into the Escrow', async function () {
    const amount = ZAP_DATA.milestoneAmounts[0];
    const clientToken = getContract({
      address: ZAP_DATA.token,
      abi: wethAbi,
      client: { public: publicClient, wallet: client },
    });
    await clientToken.write.deposit([], { value: amount });
    await clientToken.write.transfer([escrow.address, amount]);
    expect(await clientToken.read.balanceOf([escrow.address])).to.equal(amount);
  });

  it('Should let the client deposit into the Escrow with a fallback', async function () {
    const amount = ZAP_DATA.milestoneAmounts[0];
    await client.sendTransaction({
      to: escrow.address,
      value: amount,
    });
    expect(await token.read.balanceOf([escrow.address])).to.equal(amount);
  });

  it('Should let the client deposit a milestone and release it', async function () {
    const amount = ZAP_DATA.milestoneAmounts[0];
    const clientToken = getContract({
      address: ZAP_DATA.token,
      abi: wethAbi,
      client: { public: publicClient, wallet: client },
    });
    const startingDaoReceiver = (await clientToken.read.balanceOf([
      daoReceiver,
    ])) as bigint;
    const startingDeployerBalance = (await clientToken.read.balanceOf([
      deployer.account.address,
    ])) as bigint;
    const startingAlternateBalance = (await clientToken.read.balanceOf([
      alternate.account.address,
    ])) as bigint;
    await clientToken.write.deposit([], { value: amount });
    await clientToken.write.transfer([escrow.address, amount]);
    expect(await clientToken.read.balanceOf([escrow.address])).to.equal(amount);

    await escrow.write.release([0n], { account: client.account });
    expect(await clientToken.read.balanceOf([daoSplit])).to.equal(amount);

    const daoSplitSetup = [
      { address: await spoilsManager.read.receiver(), percent: 10 * 1e4 },
      { address: teamSplit, percent: 90 * 1e4 },
    ].sort((a, b) => a.address.localeCompare(b.address));

    await splitMain.write.distributeERC20([
      daoSplit,
      ZAP_DATA.token,
      daoSplitSetup.map(({ address }) => address),
      daoSplitSetup.map(({ percent }) => percent),
      0,
      deployer.account.address,
    ]);

    expect(await clientToken.read.balanceOf([daoSplit])).to.equal(BigInt(1));

    await splitMain.write.withdraw([daoReceiver, 0, [ZAP_DATA.token]]);
    await splitMain.write.withdraw([teamSplit, 0, [ZAP_DATA.token]]);

    expect(await clientToken.read.balanceOf([daoReceiver])).to.equal(
      startingDaoReceiver + (amount * BigInt(10)) / BigInt(100) - BigInt(2),
    );

    const teamSplitAmount = (await clientToken.read.balanceOf([
      teamSplit,
    ])) as bigint;
    expect(teamSplitAmount).to.equal(
      (amount * BigInt(90)) / BigInt(100) - BigInt(2),
    );

    await splitMain.write.distributeERC20([
      teamSplit,
      ZAP_DATA.token,
      ZAP_DATA.owners,
      ZAP_DATA.percentAllocations,
      0,
      deployer.account.address,
    ]);

    expect(await clientToken.read.balanceOf([teamSplit])).to.equal(BigInt(1));

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

    expect(
      await clientToken.read.balanceOf([deployer.account.address]),
    ).to.equal(
      startingDeployerBalance + teamSplitAmount / BigInt(2) - BigInt(2),
    );
    expect(
      await clientToken.read.balanceOf([alternate.account.address]),
    ).to.equal(
      startingAlternateBalance + teamSplitAmount / BigInt(2) - BigInt(2),
    );
  });

  it('Should let the deployer skip the safe deploy', async function () {
    const localEncodedEscrowData = encodeAbiParameters(
      [
        'address',
        'uint32',
        'address',
        'address',
        'uint256',
        'uint256',
        'bytes32',
      ].map(t => ({ type: t })),
      [
        ZAP_DATA.client,
        ZAP_DATA.arbitration,
        ZAP_DATA.resolver,
        ZAP_DATA.token,
        ZAP_DATA.escrowDeadline,
        ZAP_DATA.saltNonce + 200 * i,
        ZAP_DATA.details,
      ],
    );

    const txHash = await zap.write.createSafeSplitEscrow([
      ZAP_DATA.owners,
      ZAP_DATA.percentAllocations,
      ZAP_DATA.milestoneAmounts,
      encodedSafeData,
      getAddress(deployer.account.address),
      encodedSplitData,
      localEncodedEscrowData,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const events = parseEventLogs({
      logs: receipt.logs,
      abi: zap.abi,
    });

    const zapCreatedEvent = events.find(
      e => e.eventName === 'SafeSplitsDaoEscrowCreated',
    );
    if (!zapCreatedEvent) {
      throw new Error('SafeSplitsDaoEscrowCreated event not found');
    }

    const safeAddress = zapCreatedEvent.args.safe;
    expect(safeAddress).to.equal(getAddress(deployer.account.address));
  });

  it('Should let the deployer skip the team split', async function () {
    const localEncodedSafeData = encodeAbiParameters(
      ['uint256', 'uint256'].map(t => ({ type: t })),
      [ZAP_DATA.threshold, ZAP_DATA.saltNonce + 100 * i],
    );
    const localEncodedSplitData = encodeAbiParameters(
      ['bool', 'bool'].map(t => ({ type: t })),
      [false, true],
    );
    const localEncodedEscrowData = encodeAbiParameters(
      [
        'address',
        'uint32',
        'address',
        'address',
        'uint256',
        'uint256',
        'bytes32',
      ].map(t => ({ type: t })),
      [
        ZAP_DATA.client,
        ZAP_DATA.arbitration,
        ZAP_DATA.resolver,
        ZAP_DATA.token,
        ZAP_DATA.escrowDeadline,
        ZAP_DATA.saltNonce + 100 * i,
        ZAP_DATA.details,
      ],
    );

    const txHash = await zap.write.createSafeSplitEscrow([
      ZAP_DATA.owners,
      ZAP_DATA.percentAllocations,
      ZAP_DATA.milestoneAmounts,
      localEncodedSafeData,
      zeroAddress,
      localEncodedSplitData,
      localEncodedEscrowData,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const events = parseEventLogs({
      logs: receipt.logs,
      abi: zap.abi,
    });

    const zapCreatedEvent = events.find(
      e => e.eventName === 'SafeSplitsDaoEscrowCreated',
    );
    if (!zapCreatedEvent) {
      throw new Error('SafeSplitsDaoEscrowCreated event not found');
    }

    const teamSplitAddress = zapCreatedEvent.args.projectTeamSplit;
    const safeAddress = zapCreatedEvent.args.safe;
    expect(teamSplitAddress).to.equal(safeAddress);
  });

  it('Should let the deployer skip the dao split', async function () {
    const localEncodedSafeData = encodeAbiParameters(
      ['uint256', 'uint256'].map(t => ({ type: t })),
      [ZAP_DATA.threshold, ZAP_DATA.saltNonce + 300 * i],
    );
    const localEncodedSplitData = encodeAbiParameters(
      ['bool', 'bool'].map(t => ({ type: t })),
      [true, false],
    );
    const localEncodedEscrowData = encodeAbiParameters(
      [
        'address',
        'uint32',
        'address',
        'address',
        'uint256',
        'uint256',
        'bytes32',
      ].map(t => ({ type: t })),
      [
        ZAP_DATA.client,
        ZAP_DATA.arbitration,
        ZAP_DATA.resolver,
        ZAP_DATA.token,
        ZAP_DATA.escrowDeadline,
        ZAP_DATA.saltNonce + 300 * i,
        ZAP_DATA.details,
      ],
    );

    const txHash = await zap.write.createSafeSplitEscrow([
      ZAP_DATA.owners,
      ZAP_DATA.percentAllocations,
      ZAP_DATA.milestoneAmounts,
      localEncodedSafeData,
      zeroAddress,
      localEncodedSplitData,
      localEncodedEscrowData,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const events = parseEventLogs({
      logs: receipt.logs,
      abi: zap.abi,
    });

    const zapCreatedEvent = events.find(
      e => e.eventName === 'SafeSplitsDaoEscrowCreated',
    );
    if (!zapCreatedEvent) {
      throw new Error('SafeSplitsDaoEscrowCreated event not found');
    }

    const daoSplitAddress = zapCreatedEvent.args.daoSplit;
    expect(daoSplitAddress).to.equal(zeroAddress);
  });
});

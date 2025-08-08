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

const formatBytes32String = (str: string) => toHex(toBytes(str, { size: 32 }));

// Use forked sepolia for tests to avoid deploying dependency contracts
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
  isDaoSplit: false, // isDaoSplit
  isProjectSplit: true, // isProjectSplit
  token: getWrappedTokenAddress(TEST_CHAIN_ID) as Hex, // token
  escrowDeadline: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60, // deadline
  details: formatBytes32String('ipfs://'), // details
  owners: [] as Array<Hex>,
  client: '' as Hex,
  resolver: '' as Hex,
};

describe('SafeSplitsEscrowZap', function () {
  let publicClient: PublicClient;
  let deployer: WalletClient;
  let alternate: WalletClient;
  let client: WalletClient;
  let resolver: WalletClient;
  let factory: ContractTypesMap['SafeSplitsEscrowZapFactory'];
  let implementation: ContractTypesMap['SafeSplitsEscrowZap'];
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
  let escrow: ContractTypesMap['SmartInvoiceUpdatable'];
  let token: GetContractReturnType<
    typeof wethAbi,
    { public: PublicClient; wallet: WalletClient }
  >;
  let i = 0;

  before(async function () {
    publicClient = await viem.getPublicClient();
    [deployer, alternate, client, resolver] = await viem.getWalletClients();
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

    // Deploy zap implementation
    implementation = await viem.deployContract('SafeSplitsEscrowZap');
    expect(implementation.address).to.not.equal(zeroAddress);

    // Deploy zap factory
    factory = await viem.deployContract('SafeSplitsEscrowZapFactory', [
      implementation.address,
    ]);
    expect(factory.address).to.not.equal(zeroAddress);

    // Deploy zap instance
    const zapDeployData = [
      zapData.safeSingleton, // singleton
      zapData.fallbackHandler, // fallback handler
      zapData.safeFactory, // safe factory
      zapData.splitMain, // split main
      getFactory(TEST_CHAIN_ID), // escrow factory
      getWrappedTokenAddress(TEST_CHAIN_ID), // wrapped token
    ];
    const encodedData = encodeAbiParameters(
      ['address', 'address', 'address', 'address', 'address', 'address'].map(
        t => ({ type: t }),
      ),
      zapDeployData,
    );
    const hash = await factory.write.createSafeSplitsEscrowZap([
      encodedData,
      formatBytes32String(String(ZAP_DATA.saltNonce)),
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const zapAddress = receipt.logs[0].address;
    zap = await viem.getContractAt('SafeSplitsEscrowZap', zapAddress);
  });

  beforeEach(async function () {
    i += 1; // increment to avoid nonce collisions in Create2 deployments

    // Create with zap
    const encodedSafeData = encodeAbiParameters(
      ['uint256', 'uint256'].map(t => ({ type: t })),
      [ZAP_DATA.threshold, ZAP_DATA.saltNonce + i],
    );
    const encodedSplitData = encodeAbiParameters(
      [{ type: 'bool' }],
      [ZAP_DATA.isProjectSplit],
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
      zeroAddress, // safe address,
      encodedSplitData, // split data,
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
      e => e.eventName === 'SafeSplitsEscrowCreated',
    );
    if (!zapCreatedEvent) {
      throw new Error('SafeSplitsEscrowCreated event not found');
    }
    const safeAddress = zapCreatedEvent.args.safe;
    const splitAddress = zapCreatedEvent.args.projectTeamSplit;
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
    escrow = await viem.getContractAt('SmartInvoiceUpdatable', escrowAddress);
    split = splitAddress;
  });

  it('Should deploy a Zap instance', async function () {
    expect(zap.address).to.not.equal(zeroAddress);
    expect(await zap.read.safeSingleton()).to.equal(zapData.safeSingleton);
    expect(await zap.read.safeFactory()).to.equal(zapData.safeFactory);
    expect(await zap.read.splitMain()).to.equal(zapData.splitMain);
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

  it('Should create a Split', async function () {
    expect(split).to.not.equal(zeroAddress);
    expect(await splitMain.read.getController([split])).to.equal(safe.address);
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
    expect(await escrow.read.providerReceiver()).to.equal(split);
    expect(await escrow.read.provider()).to.equal(safe.address);
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
    const beforeDeployerBalance = (await clientToken.read.balanceOf([
      deployer.account.address,
    ])) as bigint;
    const beforeAlternateBalance = (await clientToken.read.balanceOf([
      alternate.account.address,
    ])) as bigint;
    await clientToken.write.deposit([], { value: amount });
    await clientToken.write.transfer([escrow.address, amount]);
    expect(await clientToken.read.balanceOf([escrow.address])).to.equal(amount);
    await escrow.write.release({ account: client.account });
    expect(await clientToken.read.balanceOf([split])).to.equal(amount);
    await splitMain.write.distributeERC20([
      split,
      ZAP_DATA.token,
      ZAP_DATA.owners.sort(),
      ZAP_DATA.percentAllocations,
      0,
      deployer.account.address,
    ]);
    expect(await clientToken.read.balanceOf([split])).to.equal(BigInt(1)); // ERC20 split leaves 1 for gas efficiency
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
    const afterDeployerBalance = (await clientToken.read.balanceOf([
      deployer.account.address,
    ])) as bigint;
    const afterAlternateBalance = (await clientToken.read.balanceOf([
      alternate.account.address,
    ])) as bigint;
    expect(afterDeployerBalance - beforeDeployerBalance).to.equal(
      amount / BigInt(2) - BigInt(2),
    ); // the math works?
    expect(afterAlternateBalance - beforeAlternateBalance).to.equal(
      amount / BigInt(2) - BigInt(2),
    );
  }).timeout(80000);

  // it should let the safe update the split - handle from Safe UI for now
});

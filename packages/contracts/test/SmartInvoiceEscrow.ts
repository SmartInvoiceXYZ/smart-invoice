import {
  PublicClient,
  TestClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types';
import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import {
  encodeAbiParameters,
  getAddress,
  Hex,
  parseEventLogs,
  toBytes,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem';

import {
  awaitInvoiceAddress,
  createEscrow,
  currentTimestamp,
  getBalanceOf,
  getLockedEscrow,
  setBalanceOf,
} from './utils';

const individualResolverType = 0;
const arbitratorResolverType = 1;
const amounts = [BigInt(10), BigInt(10)];
const total = amounts.reduce((t, v) => t + v, BigInt(0));
const terminationTime =
  Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60;
const resolutionRate = 20n;
const requireVerification = true;
const invoiceType = toHex(toBytes('escrow', { size: 32 }));

describe('SmartInvoiceEscrow', function () {
  let factory: ContractTypesMap['SmartInvoiceFactory'];
  let invoice: ContractTypesMap['SmartInvoiceEscrow'];
  let mockToken: Hex;
  let otherMockToken: Hex;
  let mockWrappedNativeTokenContract: ContractTypesMap['MockWETH'];
  let mockWrappedNativeToken: Hex;
  let mockArbitrator: Hex;
  let mockArbitratorContract: ContractTypesMap['MockArbitrator'];
  let client: WalletClient;
  let provider: WalletClient;
  let resolver: WalletClient;
  let randomSigner: WalletClient;
  let publicClient: PublicClient;
  let testClient: TestClient;
  let invoiceAddress: Hex | null;

  beforeEach(async function () {
    const walletClients = await viem.getWalletClients();
    [client, provider, resolver, randomSigner] = walletClients;
    publicClient = await viem.getPublicClient();
    testClient = await viem.getTestClient();

    const mockTokenContract = await viem.deployContract('MockToken');
    mockToken = getAddress(mockTokenContract.address);

    const otherMockTokenContract = await viem.deployContract('MockToken');
    otherMockToken = getAddress(otherMockTokenContract.address);

    mockWrappedNativeTokenContract = await viem.deployContract('MockWETH');
    mockWrappedNativeToken = getAddress(mockWrappedNativeTokenContract.address);

    mockArbitratorContract = await viem.deployContract('MockArbitrator', [10n]);
    mockArbitrator = getAddress(mockArbitratorContract.address);

    factory = await viem.deployContract('SmartInvoiceFactory', [
      mockWrappedNativeToken,
    ]);
    const invoiceImpl = await viem.deployContract('SmartInvoiceEscrow');

    await factory.write.addImplementation([invoiceType, invoiceImpl.address]);

    const data = encodeAbiParameters(
      [
        'address',
        'uint8',
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'bool',
        'address',
      ].map(v => ({ type: v })),
      [
        getAddress(client.account.address),
        individualResolverType,
        getAddress(resolver.account.address),
        mockToken,
        BigInt(terminationTime),
        zeroHash,
        mockWrappedNativeToken,
        requireVerification,
        factory.address,
      ],
    );

    const hash = await factory.write.create([
      getAddress(provider.account.address),
      amounts,
      data,
      invoiceType,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', address!);
    invoiceAddress = getAddress(address!);
  });

  it('Should deploy a SmartInvoice', async function () {
    expect(await invoice.read.client()).to.equal(
      getAddress(client.account.address),
    );
    expect(await invoice.read.provider()).to.equal(
      getAddress(provider.account.address),
    );
    expect(await invoice.read.resolverType()).to.equal(individualResolverType);
    expect(await invoice.read.resolver()).to.equal(
      getAddress(resolver.account.address),
    );
    expect(await invoice.read.token()).to.equal(mockToken);

    for (let i = 0; i < amounts.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect(await invoice.read.amounts([BigInt(i)])).to.equal(amounts[i]);
    }
    expect(await invoice.read.terminationTime()).to.equal(terminationTime);
    expect(await invoice.read.details()).to.equal(zeroHash);
    expect(await invoice.read.resolutionRate()).to.equal(resolutionRate);
    expect(await invoice.read.milestone()).to.equal(0n);
    expect(await invoice.read.total()).to.equal(total);
    expect(await invoice.read.locked()).to.equal(false);
    expect(await invoice.read.disputeId()).to.equal(0n);
    expect(await invoice.read.wrappedNativeToken()).to.equal(
      mockWrappedNativeToken,
    );
  });

  it('Should revert init if initLocked', async function () {
    const currentTime = await currentTimestamp();
    const newInvoice = await viem.deployContract('SmartInvoiceEscrow');

    const data = encodeAbiParameters(
      [
        'address',
        'uint8',
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'bool',
      ].map(v => ({ type: v })),
      [
        getAddress(client.account.address),
        individualResolverType,
        getAddress(resolver.account.address),
        mockToken,
        BigInt(currentTime - 3600),
        zeroHash,
        mockWrappedNativeToken,
        requireVerification,
      ],
    );

    const receipt = newInvoice.write.init([
      getAddress(provider.account.address),
      amounts,
      data,
    ]);
    await expect(receipt).to.be.revertedWith(
      'Initializable: contract is already initialized',
    );
  });

  it('Should revert init if invalid client', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createEscrow(
      factory,
      invoice,
      invoiceType,
      zeroAddress,
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime - 3600,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    await expect(receipt).to.be.revertedWith('invalid client');
  });

  it('Should revert init if invalid provider', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      zeroAddress,
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    await expect(receipt).to.be.revertedWith('invalid provider');
  });

  it('Should revert init if invalid resolver', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      zeroAddress,
      mockToken,
      amounts,
      currentTime - 3600,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    await expect(receipt).to.be.revertedWith('invalid resolver');
  });

  it('Should revert init if invalid token', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      zeroAddress,
      amounts,
      currentTime - 3600,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    await expect(receipt).to.be.revertedWith('invalid token');
  });

  it('Should revert init if invalid wrappedNativeToken', async function () {
    const receipt = createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      terminationTime,
      zeroHash,
      zeroAddress,
      requireVerification,
    );
    await expect(receipt).to.be.revertedWith('invalid wrappedNativeToken');
  });

  it('Should revert init if terminationTime has ended', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime - 3600,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    await expect(receipt).to.be.revertedWith('duration ended');
  });

  it('Should revert init if terminationTime too long', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 5 * 365 * 24 * 3600,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    await expect(receipt).to.be.revertedWith('duration too long');
  });

  it('Default resolution rate should equal 20', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 365 * 24 * 3600,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    const invoiceAddr = await awaitInvoiceAddress(tx);
    const deployedInvoice = await viem.getContractAt(
      'SmartInvoiceEscrow',
      invoiceAddr!,
    );
    expect(await deployedInvoice.read.resolutionRate()).to.equal(
      resolutionRate,
    );
  });

  it('Should revert init if resolverType > 1', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      2,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 365 * 24 * 3600,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    await expect(receipt).to.revertedWith('invalid resolverType');
  });

  it('Should revert release by non client', async function () {
    await expect(
      invoice.write.release({ account: provider.account }),
    ).to.be.revertedWith('!client');
  });

  it('Should revert release with low balance', async function () {
    // await setBalanceOf(mockToken, invoice.address, 5);
    await setBalanceOf(mockToken, invoice.address, 5);
    await expect(invoice.write.release()).to.be.revertedWith(
      'insufficient balance',
    );
  });

  it('Should release', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const beforeBalance = await getBalanceOf(
      mockToken,
      provider.account.address,
    );
    const receipt = await invoice.write.release();
    expect(await invoice.read.released()).to.equal(10);
    expect(await invoice.read.milestone()).to.equal(1);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(0, 10);
    const afterBalance = await getBalanceOf(
      mockToken,
      provider.account.address,
    );
    expect(afterBalance).to.equal(beforeBalance + 10n);
  });

  it('Should release full balance at last milestone', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const beforeBalance = await getBalanceOf(
      mockToken,
      provider.account.address,
    );
    let receipt = await invoice.write.release();
    expect(await invoice.read.released()).to.equal(10);
    expect(await invoice.read.milestone()).to.equal(1);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(0, 10);
    await setBalanceOf(mockToken, invoice.address, 15);
    receipt = await invoice.write.release();
    expect(await invoice.read.released()).to.equal(25);
    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(1, 15);
    const afterBalance = await getBalanceOf(
      mockToken,
      provider.account.address,
    );
    expect(afterBalance).to.equal(beforeBalance + 25n);
  });

  it('Should release full balance after all milestones are completed', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const beforeBalance = await getBalanceOf(
      mockToken,
      provider.account.address,
    );
    let receipt = await invoice.write.release();
    await setBalanceOf(mockToken, invoice.address, 15);
    receipt = await invoice.write.release();
    expect(await invoice.read.released()).to.equal(25);
    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(1, 15);

    await setBalanceOf(mockToken, invoice.address, 20);
    receipt = await invoice.write.release();
    expect(await invoice.read.released()).to.equal(45);
    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(2, 20);
    const afterBalance = await getBalanceOf(
      mockToken,
      provider.account.address,
    );
    expect(afterBalance).to.equal(beforeBalance + 45n);
  });

  it('Should revert release if 0 balance after all milestones are completed', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    let receipt = await invoice.write.release();
    await setBalanceOf(mockToken, invoice.address, 15);
    receipt = await invoice.write.release();
    expect(await invoice.read.released()).to.equal(25);
    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(1, 15);

    await setBalanceOf(mockToken, invoice.address, 0);
    await expect(invoice.write.release()).to.be.revertedWith('balance is 0');
  });

  it('Should revert release if locked', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      client.account.address,
      provider.account.address,
      individualResolverType,
      resolver.account.address,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    expect(lockedInvoice.write.release()).to.be.revertedWith('locked');
  });

  it('Should release with milestone number', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = await invoice.write.release([0n]);
    expect(await invoice.read.released()).to.equal(10);
    expect(await invoice.read.milestone()).to.equal(1);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(0, 10);
  });

  it('Should release with higher milestone number', async function () {
    await setBalanceOf(mockToken, invoice.address, 20);
    const receipt = await invoice.write.release([1n]);
    expect(await invoice.read.released()).to.equal(20);
    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(0, 10);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(1, 10);
  });

  it('Should release all with higher milestone number', async function () {
    await setBalanceOf(mockToken, invoice.address, 25);
    const receipt = await invoice.write.release([1n]);
    expect(await invoice.read.released()).to.equal(25);
    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(0, 10);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(1, 15);
  });

  it('Should revert release with higher milestone number', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = invoice.write.release([1n]);
    await expect(receipt).to.revertedWith('insufficient balance');
  });

  it('Should revert release with invalid milestone number', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = invoice.write.release([5n]);
    await expect(receipt).to.revertedWith('invalid milestone');
  });

  it('Should revert release with passed milestone number', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    await invoice.write.release();
    const receipt = invoice.write.release([0n]);
    await expect(receipt).to.revertedWith('milestone passed');
  });

  it('Should revert release milestone if not client', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = invoice.write.release([0n], { account: provider.account });
    await expect(receipt).to.revertedWith('!client');
  });

  it('Should revert release milestone if locked', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      client.account.address,
      provider.account.address,
      individualResolverType,
      resolver.account.address,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await expect(lockedInvoice.write.release([0n])).to.be.revertedWith(
      'locked',
    );
  });

  it('Should releaseTokens with passed token', async function () {
    await setBalanceOf(otherMockToken, invoice.address, 10);
    await invoice.write.releaseTokens([otherMockToken]);
  });

  it('Should call release if releaseTokens with invoice token', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = await invoice.write.releaseTokens([mockToken]);
    expect(await invoice.read.released()).to.equal(10);
    expect(await invoice.read.milestone()).to.equal(1);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(0, 10);
  });

  it('Should revert releaseTokens if not client', async function () {
    const receipt = invoice.write.releaseTokens([otherMockToken], {
      account: provider.account,
    });
    await expect(receipt).to.revertedWith('!client');
  });

  it('Should revert withdraw before terminationTime', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 3600,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

    const receipt = invoice.write.withdraw();
    await expect(receipt).to.revertedWith('!terminated');
  });

  it('Should revert withdraw if locked', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await expect(lockedInvoice.write.withdraw()).to.be.revertedWith('locked');
  });

  it('Should withdraw after terminationTime', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(mockToken, invoice.address, 10);

    const receipt = await invoice.write.withdraw();
    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Withdraw').withArgs(10);
  });

  it('Should revert withdraw after terminationTime if balance is 0', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(mockToken, invoice.address, 0);

    const receipt = invoice.write.withdraw();
    await expect(receipt).to.be.revertedWith('balance is 0');
  });

  it('Should call withdraw from withdrawTokens', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);
    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(mockToken, invoice.address, 10);

    const receipt = await invoice.write.withdrawTokens([mockToken]);
    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Withdraw').withArgs(10);
  });

  it('Should withdrawTokens for otherToken', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);
    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(otherMockToken, invoice.address, 10);

    await invoice.write.withdrawTokens([otherMockToken]);
    expect(await invoice.read.milestone()).to.equal(0);
  });

  it('Should revert withdrawTokens for otherToken if not terminated', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

    const receipt = invoice.write.withdrawTokens([otherMockToken]);
    await expect(receipt).to.be.revertedWith('!terminated');
  });

  it('Should revert withdrawTokens for otherToken if balance is 0', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(otherMockToken, invoice.address, 0);
    const receipt = invoice.write.withdrawTokens([otherMockToken]);
    await expect(receipt).to.be.revertedWith('balance is 0');
  });

  it('Should revert lock if terminated', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = invoice.write.lock([zeroHash]);
    await expect(receipt).to.be.revertedWith('terminated');
  });

  it('Should revert lock if balance is 0', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);
    await setBalanceOf(mockToken, invoice.address, 0);
    const receipt = invoice.write.lock([zeroHash]);
    await expect(receipt).to.be.revertedWith('balance is 0');
  });

  it('Should revert lock if not client or provider', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = invoice.write.lock([zeroHash], {
      account: resolver.account,
    });
    await expect(receipt).to.be.revertedWith('!party');
  });

  it('Should revert lock if locked', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    const receipt = lockedInvoice.write.lock([zeroHash]);
    await expect(receipt).to.be.revertedWith('locked');
  });

  it('Should lock if balance is greater than 0', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    expect(await lockedInvoice.read.locked()).to.equal(true);
  });

  it('Should revert resolve if not locked', async function () {
    await expect(invoice.write.resolve([0n, 10n, zeroHash])).to.be.revertedWith(
      '!locked',
    );
  });

  it('Should revert resolve if balance is 0', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 0);
    await expect(
      lockedInvoice.write.resolve([0n, 10n, zeroHash]),
    ).to.be.revertedWith('balance is 0');
  });

  it('Should revert resolve if not resolver', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 10);
    await expect(
      lockedInvoice.write.resolve([0n, 10n, zeroHash]),
    ).to.be.revertedWith('!resolver');
  });

  it('Should revert resolve if awards do not add up', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 10);
    await expect(
      lockedInvoice.write.resolve([0n, 0n, zeroHash], {
        account: resolver.account,
      }),
    ).to.be.revertedWith('resolution != remainder');
  });

  it('Should revert resolver if not individual', async function () {
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      getAddress(resolver.account.address),
      mockWrappedNativeToken,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);
    expect(await invoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    await expect(invoice.write.resolve([0n, 0n, zeroHash])).to.be.revertedWith(
      '!individual resolver',
    );
  });

  it('Should resolve with correct rewards', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const clientBeforeBalance = await getBalanceOf(
      mockToken,
      client.account.address,
    );
    const providerBeforeBalance = await getBalanceOf(
      mockToken,
      provider.account.address,
    );
    const resolverBeforeBalance = await getBalanceOf(
      mockToken,
      resolver.account.address,
    );
    const receipt = lockedInvoice.write.resolve([5n, 90n, zeroHash], {
      account: resolver.account,
    });
    await expect(receipt)
      .to.emit(lockedInvoice, 'Resolve')
      .withArgs(getAddress(resolver.account.address), 5, 90, 5, zeroHash);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
    const clientAfterBalance = await getBalanceOf(
      mockToken,
      client.account.address,
    );
    const providerAfterBalance = await getBalanceOf(
      mockToken,
      provider.account.address,
    );
    const resolverAfterBalance = await getBalanceOf(
      mockToken,
      resolver.account.address,
    );
    expect(clientAfterBalance).to.be.equal(clientBeforeBalance + 5n);
    expect(providerAfterBalance).to.be.equal(providerBeforeBalance + 90n);
    expect(resolverAfterBalance).to.be.equal(resolverBeforeBalance + 5n);
  });

  it('Should resolve and not transfer if 0 clientAward', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const receipt = lockedInvoice.write.resolve([0n, 95n, zeroHash], {
      account: resolver.account,
    });
    await expect(receipt)
      .to.emit(lockedInvoice, 'Resolve')
      .withArgs(getAddress(resolver.account.address), 0, 95, 5, zeroHash);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
  });

  it('Should resolve and not transfer if 0 providerAward', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const receipt = lockedInvoice.write.resolve([95n, 0n, zeroHash], {
      account: resolver.account,
    });
    await expect(receipt)
      .to.emit(lockedInvoice, 'Resolve')
      .withArgs(getAddress(resolver.account.address), 95, 0, 5, zeroHash);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
  });

  it('Should resolve and not transfer if 0 resolutionFee', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 10);
    const receipt = lockedInvoice.write.resolve([5n, 5n, zeroHash], {
      account: resolver.account,
    });
    await expect(receipt)
      .to.emit(lockedInvoice, 'Resolve')
      .withArgs(getAddress(resolver.account.address), 5, 5, 0, zeroHash);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
  });

  it('Should revert rule if not arbitrable', async function () {
    expect(await invoice.read.resolverType()).to.be.equal(
      individualResolverType,
    );
    await expect(invoice.write.rule([0n, 0n])).to.be.revertedWith(
      '!arbitrator resolver',
    );
  });

  it('Should revert rule if not locked', async function () {
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockWrappedNativeToken,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);
    await expect(invoice.write.rule([0n, 0n])).to.be.revertedWith('!locked');
  });

  it('Should revert rule if not resolver', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
      requireVerification,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    await expect(
      lockedInvoice.write.rule([0n, 0n], { account: provider.account }),
    ).to.be.revertedWith('!resolver');
  });

  it('Should revert rule if invalid disputeId', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
      requireVerification,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    const receipt = mockArbitratorContract.write.executeRulingWithDisputeId([
      lockedInvoice.address,
      6n,
      10n,
    ]);
    await expect(receipt).to.be.revertedWith('incorrect disputeId');
  });

  it('Should revert rule if invalid ruling', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
      requireVerification,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    const receipt = mockArbitratorContract.write.executeRuling([
      lockedInvoice.address,
      6n,
    ]);
    await expect(receipt).to.be.revertedWith('invalid ruling');
  });

  it('Should revert rule if balance is 0', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    await setBalanceOf(mockToken, lockedInvoice.address, 0);
    const receipt = mockArbitratorContract.write.executeRuling([
      lockedInvoice.address,
      1n,
    ]);
    await expect(receipt).to.be.revertedWith('balance is 0');
  });

  it('Should rule 1:1 for ruling 0', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
    );

    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const receipt = await mockArbitratorContract.write.executeRuling([
      lockedInvoice.address,
      0n,
    ]);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Rule')
      .withArgs(mockArbitrator, 50, 50, 0);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Ruling')
      .withArgs(mockArbitrator, 1, 0);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
  });

  it('Should rule 1:0 for ruling 1', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const receipt = await mockArbitratorContract.write.executeRuling([
      lockedInvoice.address,
      1n,
    ]);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Rule')
      .withArgs(mockArbitrator, 100, 0, 1);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Ruling')
      .withArgs(mockArbitrator, 1, 1);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
  });

  it('Should rule 3:1 for ruling 2', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const receipt = await mockArbitratorContract.write.executeRuling([
      lockedInvoice.address,
      2n,
    ]);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Rule')
      .withArgs(mockArbitrator, 75, 25, 2);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Ruling')
      .withArgs(mockArbitrator, 1, 2);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
  });

  it('Should rule 1:1 for ruling 3', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const receipt = await mockArbitratorContract.write.executeRuling([
      lockedInvoice.address,
      3n,
    ]);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Rule')
      .withArgs(mockArbitrator, 50, 50, 3);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Ruling')
      .withArgs(mockArbitrator, 1, 3);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
  });

  it('Should rule 1:3 for ruling 4', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const receipt = await mockArbitratorContract.write.executeRuling([
      lockedInvoice.address,
      4n,
    ]);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Rule')
      .withArgs(mockArbitrator, 25, 75, 4);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Ruling')
      .withArgs(mockArbitrator, 1, 4);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
  });

  it('Should rule 0:1 for ruling 5', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
      10n,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const receipt = await mockArbitratorContract.write.executeRuling([
      lockedInvoice.address,
      5n,
    ]);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Rule')
      .withArgs(mockArbitrator, 0, 100, 5);
    await expect(receipt)
      .to.emit(lockedInvoice, 'Ruling')
      .withArgs(mockArbitrator, 1, 5);
    expect(await lockedInvoice.read.released()).to.be.equal(0);
    expect(await lockedInvoice.read.milestone()).to.be.equal(2);
    expect(await lockedInvoice.read.locked()).to.be.equal(false);
  });

  it('Should revert receive if not wrappedNativeToken', async function () {
    const receipt = client.sendTransaction({
      to: invoice.address,
      value: 10n,
    });
    await expect(receipt).to.be.revertedWith('!wrappedNativeToken');
  });

  it('Should revert receive if locked', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    const receipt = client.sendTransaction({
      to: lockedInvoice.address,
      value: 10n,
    });
    await expect(receipt).to.be.revertedWith('locked');
  });

  it('Should accept receive and convert to wrapped token', async function () {
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockWrappedNativeToken,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);
    const receipt = await client.sendTransaction({
      to: invoice.address,
      value: 10n,
    });
    await expect(receipt)
      .to.emit(invoice, 'Deposit')
      .withArgs(getAddress(client.account.address), 10);
    expect(
      await mockWrappedNativeTokenContract.read.balanceOf([invoice.address]),
    ).to.equal(10);
  });

  it('Should emit Verified when client calls verify()', async function () {
    await expect(invoice.write.verify({ account: client.account }))
      .to.emit(invoice, 'Verified')
      .withArgs(getAddress(client.account.address), invoice.address);
  });

  it('Should not emit Verified if caller !client', async function () {
    await expect(invoice.write.verify({ account: randomSigner.account })).to.be
      .reverted;
  });

  it('Should emit Verified if client verification requirement waived on invoice creation', async function () {
    const noVerification = false;
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      noVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

    const events = parseEventLogs({
      abi: invoice.abi,
      logs: tx.logs,
    });

    const event = events.find(e => e.eventName === 'Verified');
    expect(event).to.not.equal(undefined);
    expect(event!.args.client).to.equal(getAddress(client.account.address));
    expect(event!.args.invoice).to.equal(getAddress(invoice.address));
  });

  it('Should addMilestones if client', async function () {
    await invoice.write.addMilestones([[13n, 14n]]);
    expect((await invoice.read.getAmounts()).length).to.equal(4);
    expect(await invoice.read.amounts([0n])).to.equal(10n);
    expect(await invoice.read.amounts([1n])).to.equal(10n);
    expect(await invoice.read.amounts([2n])).to.equal(13n);
    expect(await invoice.read.amounts([3n])).to.equal(14n);
  });

  it('Should addMilestones if provider', async function () {
    await invoice.write.addMilestones([[13n, 14n]], {
      account: provider.account,
    });
    expect((await invoice.read.getAmounts()).length).to.equal(4);
    expect(await invoice.read.amounts([0n])).to.equal(10n);
    expect(await invoice.read.amounts([1n])).to.equal(10n);
    expect(await invoice.read.amounts([2n])).to.equal(13n);
    expect(await invoice.read.amounts([3n])).to.equal(14n);
  });

  it('Should addMilestones and update total with added milestones', async function () {
    await invoice.write.addMilestones([[13n, 14n]], {
      account: provider.account,
    });
    expect(await invoice.read.total()).to.equal(47);
  });

  it('Should addMilestones and emit MilestonesAdded event', async function () {
    await expect(
      invoice.write.addMilestones([[13n, 14n]], { account: client.account }),
    )
      .to.emit(invoice, 'MilestonesAdded')
      .withArgs(getAddress(client.account.address), invoice.address, [
        13n,
        14n,
      ]);

    await expect(
      invoice.write.addMilestones([[13n, 14n], zeroHash], {
        account: provider.account,
      }),
    )
      .to.emit(invoice, 'MilestonesAdded')
      .withArgs(getAddress(provider.account.address), invoice.address, [
        13n,
        14n,
      ]);
  });

  it('Should revert addMilestones if executed by non-client/non-getAddress(provider.account.address)', async function () {
    await expect(
      invoice.write.addMilestones([[13n, 14n]], {
        account: randomSigner.account,
      }),
    ).to.be.revertedWith('!party');
  });

  it('Should revert addMilestones if locked', async function () {
    const lockedInvoice = await getLockedEscrow(
      factory,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      zeroHash,
      mockWrappedNativeToken,
    );
    await expect(
      lockedInvoice.write.addMilestones([[13n, 14n]]),
    ).to.be.revertedWith('locked');
  });

  it('Should revert addMilestones if terminationTime passed', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createEscrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
    );
    await testClient.increaseTime({ seconds: 1000 });
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

    await expect(invoice.write.addMilestones([[13n, 14n]])).to.be.revertedWith(
      'terminated',
    );
  });

  it('Should revert addMilestones if milestones array length is not between 1-10', async function () {
    await expect(
      invoice.write.addMilestones([[]], { account: client.account }),
    ).to.be.revertedWith('no milestones are being added');
    await expect(
      invoice.write.addMilestones(
        [[1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n]],
        { account: client.account },
      ),
    ).to.be.revertedWith('only 10 new milestones at a time');
  });

  it('Should addMilestones(uint256[],bytes32) and update details', async function () {
    const NEW_BYTES32 =
      '0x1010101000000000000000000000000000000000000000000000000000000000';

    const oldDetails = await invoice.read.details();
    await invoice.write.addMilestones([[13n, 14n], NEW_BYTES32]);
    const newDetails = await invoice.read.details();

    expect(oldDetails).to.equal(zeroHash);
    expect(oldDetails).to.not.equal(newDetails);
    expect(newDetails).to.equal(NEW_BYTES32);
  });

  it('Should addMilestones(uint256[],bytes32) and emit DetailsUpdated event', async function () {
    const NEW_BYTES32 =
      '0x1010101000000000000000000000000000000000000000000000000000000000';

    await expect(invoice.write.addMilestones([[13n, 14n], NEW_BYTES32]))
      .to.emit(invoice, 'DetailsUpdated')
      .withArgs(getAddress(client.account.address), NEW_BYTES32);

    await expect(
      invoice.write.addMilestones([[13n, 14n], NEW_BYTES32], {
        account: provider.account,
      }),
    )
      .to.emit(invoice, 'DetailsUpdated')
      .withArgs(getAddress(provider.account.address), NEW_BYTES32);
  });
});

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
  createUpdatableV2Escrow,
  currentTimestamp,
  getBalanceOf,
  getLockedUpdatableV2Escrow,
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
const invoiceType = toHex(toBytes('updatable-v2', { size: 32 }));

describe('SmartInvoiceUpdatableV2', function () {
  let factory: ContractTypesMap['SmartInvoiceFactory'];
  let invoice: ContractTypesMap['SmartInvoiceUpdatableV2'];
  let mockToken: Hex;
  let otherMockToken: Hex;
  let mockWrappedNativeTokenContract: ContractTypesMap['MockWETH'];
  let mockWrappedNativeToken: Hex;
  let mockArbitrator: Hex;
  let mockArbitratorContract: ContractTypesMap['MockArbitrator'];
  let client: WalletClient;
  let clientReceiver: WalletClient;
  let provider: WalletClient;
  let providerReceiver: WalletClient;
  let resolver: WalletClient;
  let randomSigner: WalletClient;
  let client2: WalletClient;
  let clientReceiver2: WalletClient;
  let provider2: WalletClient;
  let providerReceiver2: WalletClient;
  let publicClient: PublicClient;
  let testClient: TestClient;
  let invoiceAddress: Hex | null;

  beforeEach(async function () {
    const walletClients = await viem.getWalletClients();
    [
      client,
      clientReceiver,
      provider,
      resolver,
      randomSigner,
      providerReceiver,
      client2,
      clientReceiver2,
      provider2,
      providerReceiver2,
    ] = walletClients;
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
    const invoiceImpl = await viem.deployContract('SmartInvoiceUpdatableV2');

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
        'address',
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
        getAddress(providerReceiver.account.address),
        getAddress(clientReceiver.account.address),
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
    invoice = await viem.getContractAt('SmartInvoiceUpdatableV2', address!);
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
    expect(await invoice.read.providerReceiver()).to.equal(
      getAddress(providerReceiver.account.address),
    );
    expect(await invoice.read.clientReceiver()).to.equal(
      getAddress(clientReceiver.account.address),
    );
  });

  it('Should revert init if initLocked', async function () {
    const currentTime = await currentTimestamp();
    const newInvoice = await viem.deployContract('SmartInvoiceUpdatableV2');

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
    await expect(receipt).to.be.revertedWithCustomError(
      newInvoice,
      'InvalidInitialization',
    );
  });

  it('Should revert init if invalid client', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'InvalidClient',
    );
  });

  it('Should revert init if invalid provider', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'InvalidProvider',
    );
  });

  it('Should revert init if invalid provider receiver', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createUpdatableV2Escrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
      zeroAddress,
      getAddress(clientReceiver.account.address),
    );
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'InvalidProviderReceiver',
    );
  });

  it('Should revert init if invalid client receiver', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createUpdatableV2Escrow(
      factory,
      invoice,
      invoiceType,
      getAddress(client.account.address),
      getAddress(provider.account.address),
      individualResolverType,
      getAddress(resolver.account.address),
      mockToken,
      amounts,
      currentTime,
      zeroHash,
      mockWrappedNativeToken,
      requireVerification,
      getAddress(providerReceiver.account.address),
      zeroAddress,
    );
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'InvalidClientReceiver',
    );
  });

  it('Should revert init if invalid resolver', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'InvalidResolver',
    );
  });

  it('Should revert init if invalid token', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'InvalidToken',
    );
  });

  it('Should revert init if invalid wrappedNativeToken', async function () {
    const receipt = createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'InvalidWrappedNativeToken',
    );
  });

  it('Should revert init if terminationTime has ended', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'DurationEnded',
    );
  });

  it('Should revert init if terminationTime too long', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'DurationTooLong',
    );
  });

  it('Default resolution rate should equal 20', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    const invoiceAddr = await awaitInvoiceAddress(tx);
    expect(invoiceAddr).to.not.equal(undefined);
    const deployedInvoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddr!,
    );
    expect(await deployedInvoice.read.resolutionRate()).to.equal(
      resolutionRate,
    );
  });

  it('Should revert init if resolverType > 1', async function () {
    const currentTime = await currentTimestamp();
    const receipt = createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(receipt).to.revertedWithCustomError(
      invoice,
      'InvalidResolverType',
    );
  });

  it('Should revert release by non client', async function () {
    await expect(
      invoice.write.release({ account: provider.account }),
    ).to.be.revertedWithCustomError(invoice, 'NotClient');
  });

  it('Should revert release with low balance', async function () {
    // await setBalanceOf(mockToken, invoice.address, 5);
    await setBalanceOf(mockToken, invoice.address, 5);
    await expect(invoice.write.release()).to.be.revertedWithCustomError(
      invoice,
      'InsufficientBalance',
    );
  });

  it('Should release', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const beforeBalance = await getBalanceOf(
      mockToken,
      providerReceiver.account.address,
    );
    const receipt = await invoice.write.release();
    expect(await invoice.read.released()).to.equal(10);
    expect(await invoice.read.milestone()).to.equal(1);
    await expect(receipt).to.emit(invoice, 'Release').withArgs(0, 10);
    const afterBalance = await getBalanceOf(
      mockToken,
      providerReceiver.account.address,
    );
    expect(afterBalance).to.equal(beforeBalance + 10n);
  });

  it('Should release full balance at last milestone', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const beforeBalance = await getBalanceOf(
      mockToken,
      providerReceiver.account.address,
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
      providerReceiver.account.address,
    );
    expect(afterBalance).to.equal(beforeBalance + 25n);
  });

  it('Should release full balance after all milestones are completed', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const beforeBalance = await getBalanceOf(
      mockToken,
      providerReceiver.account.address,
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
      providerReceiver.account.address,
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
    await expect(invoice.write.release()).to.be.revertedWithCustomError(
      invoice,
      'BalanceIsZero',
    );
  });

  it('Should revert release if locked', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    expect(lockedInvoice.write.release()).to.be.revertedWithCustomError(
      invoice,
      'Locked',
    );
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
    await expect(receipt).to.revertedWithCustomError(
      invoice,
      'InsufficientBalance',
    );
  });

  it('Should revert release with invalid milestone number', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = invoice.write.release([5n]);
    await expect(receipt).to.revertedWithCustomError(
      invoice,
      'InvalidMilestone',
    );
  });

  it('Should revert release with passed milestone number', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    await invoice.write.release();
    const receipt = invoice.write.release([0n]);
    await expect(receipt).to.revertedWithCustomError(
      invoice,
      'InvalidMilestone',
    );
  });

  it('Should revert release milestone if not client', async function () {
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = invoice.write.release([0n], { account: provider.account });
    await expect(receipt).to.revertedWithCustomError(invoice, 'NotClient');
  });

  it('Should revert release milestone if locked', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(
      lockedInvoice.write.release([0n]),
    ).to.be.revertedWithCustomError(invoice, 'Locked');
  });

  it('Should releaseTokens with passed token', async function () {
    await setBalanceOf(otherMockToken, invoice.address, 10);

    const providerBeforeBalance = await getBalanceOf(
      otherMockToken,
      providerReceiver.account.address,
    );

    await invoice.write.releaseTokens([otherMockToken]);

    const providerAfterBalance = await getBalanceOf(
      otherMockToken,
      providerReceiver.account.address,
    );

    expect(providerAfterBalance).to.be.equal(providerBeforeBalance + 10n);
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
    await expect(receipt).to.revertedWithCustomError(invoice, 'NotClient');
  });

  it('Should revert withdraw before terminationTime', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );

    const receipt = invoice.write.withdraw();
    await expect(receipt).to.revertedWithCustomError(invoice, 'Terminated');
  });

  it('Should revert withdraw if locked', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await expect(lockedInvoice.write.withdraw()).to.be.revertedWithCustomError(
      invoice,
      'Locked',
    );
  });

  it('Should withdraw after terminationTime', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );

    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(mockToken, invoice.address, 10);

    const clientBeforeBalance = await getBalanceOf(
      mockToken,
      clientReceiver.account.address,
    );

    const receipt = await invoice.write.withdraw();

    const clientAfterBalance = await getBalanceOf(
      mockToken,
      clientReceiver.account.address,
    );

    expect(clientAfterBalance).to.be.equal(clientBeforeBalance + 10n);

    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Withdraw').withArgs(10);
  });

  it('Should revert withdraw after terminationTime if balance is 0', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );

    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(mockToken, invoice.address, 0);

    const receipt = invoice.write.withdraw();
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'BalanceIsZero',
    );
  });

  it('Should call withdraw from withdrawTokens', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );
    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(mockToken, invoice.address, 10);

    const clientBeforeBalance = await getBalanceOf(
      mockToken,
      clientReceiver.account.address,
    );

    const receipt = await invoice.write.withdrawTokens([mockToken]);

    const clientAfterBalance = await getBalanceOf(
      mockToken,
      clientReceiver.account.address,
    );

    expect(clientAfterBalance).to.be.equal(clientBeforeBalance + 10n);

    expect(await invoice.read.milestone()).to.equal(2);
    await expect(receipt).to.emit(invoice, 'Withdraw').withArgs(10);
  });

  it('Should withdrawTokens for otherToken', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );
    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(otherMockToken, invoice.address, 10);

    const clientBeforeBalance = await getBalanceOf(
      otherMockToken,
      clientReceiver.account.address,
    );

    await invoice.write.withdrawTokens([otherMockToken]);

    const clientAfterBalance = await getBalanceOf(
      otherMockToken,
      clientReceiver.account.address,
    );

    expect(clientAfterBalance).to.be.equal(clientBeforeBalance + 10n);
    expect(await invoice.read.milestone()).to.equal(0);
  });

  it('Should revert withdrawTokens for otherToken if not terminated', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );

    const receipt = invoice.write.withdrawTokens([otherMockToken]);
    await expect(receipt).to.be.revertedWithCustomError(invoice, 'Terminated');
  });

  it('Should revert withdrawTokens for otherToken if balance is 0', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );

    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(otherMockToken, invoice.address, 0);
    const receipt = invoice.write.withdrawTokens([otherMockToken]);
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'BalanceIsZero',
    );
  });

  it('Should revert lock if terminated', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );

    await testClient.increaseTime({ seconds: 1000 });
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = invoice.write.lock([zeroHash]);
    await expect(receipt).to.be.revertedWithCustomError(invoice, 'Terminated');
  });

  it('Should revert lock if balance is 0', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );
    await setBalanceOf(mockToken, invoice.address, 0);
    const receipt = invoice.write.lock([zeroHash]);
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'BalanceIsZero',
    );
  });

  it('Should revert lock if not client or provider', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );
    await setBalanceOf(mockToken, invoice.address, 10);
    const receipt = invoice.write.lock([zeroHash], {
      account: resolver.account,
    });
    await expect(receipt).to.be.revertedWithCustomError(invoice, 'NotParty');
  });

  it('Should revert lock if locked', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    const receipt = lockedInvoice.write.lock([zeroHash]);
    await expect(receipt).to.be.revertedWithCustomError(invoice, 'Locked');
  });

  it('Should lock if balance is greater than 0', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    expect(await lockedInvoice.read.locked()).to.equal(true);
  });

  it('Should revert resolve if not locked', async function () {
    await expect(
      invoice.write.resolve([0n, 10n, zeroHash]),
    ).to.be.revertedWithCustomError(invoice, 'Locked');
  });

  it('Should revert resolve if balance is 0', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 0);
    await expect(
      lockedInvoice.write.resolve([0n, 10n, zeroHash]),
    ).to.be.revertedWithCustomError(invoice, 'BalanceIsZero');
  });

  it('Should revert resolve if not resolver', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 10);
    await expect(
      lockedInvoice.write.resolve([0n, 10n, zeroHash]),
    ).to.be.revertedWithCustomError(invoice, 'NotResolver');
  });

  it('Should revert resolve if awards do not add up', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 10);
    await expect(
      lockedInvoice.write.resolve([0n, 0n, zeroHash], {
        account: resolver.account,
      }),
    ).to.be.revertedWithCustomError(invoice, 'ResolutionMismatch');
  });

  it('Should revert resolver if not individual', async function () {
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );
    expect(await invoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    await expect(
      invoice.write.resolve([0n, 0n, zeroHash]),
    ).to.be.revertedWithCustomError(invoice, 'InvalidIndividualResolver');
  });

  it('Should resolve with correct rewards', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await setBalanceOf(mockToken, lockedInvoice.address, 100);
    const clientBeforeBalance = await getBalanceOf(
      mockToken,
      clientReceiver.account.address,
    );
    const providerBeforeBalance = await getBalanceOf(
      mockToken,
      providerReceiver.account.address,
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
      clientReceiver.account.address,
    );
    const providerAfterBalance = await getBalanceOf(
      mockToken,
      providerReceiver.account.address,
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
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    await expect(invoice.write.rule([0n, 0n])).to.be.revertedWithCustomError(
      invoice,
      'InvalidArbitratorResolver',
    );
  });

  it('Should revert rule if not locked', async function () {
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );
    await expect(invoice.write.rule([0n, 0n])).to.be.revertedWithCustomError(
      invoice,
      'Locked',
    );
  });

  it('Should revert rule if not resolver', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
      10n,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    await expect(
      lockedInvoice.write.rule([0n, 0n], { account: provider.account }),
    ).to.be.revertedWithCustomError(invoice, 'NotResolver');
  });

  it('Should revert rule if invalid disputeId', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
      10n,
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
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'IncorrectDisputeId',
    );
  });

  it('Should revert rule if invalid ruling', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
      10n,
    );
    expect(await lockedInvoice.read.resolverType()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice.read.disputeId()).to.be.equal(1);

    const receipt = mockArbitratorContract.write.executeRuling([
      lockedInvoice.address,
      6n,
    ]);
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'InvalidRuling',
    );
  });

  it('Should revert rule if balance is 0', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'BalanceIsZero',
    );
  });

  it('Should rule 1:1 for ruling 0', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
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
    await expect(receipt).to.be.revertedWithCustomError(
      invoice,
      'InvalidWrappedNativeToken',
    );
  });

  it('Should revert receive if locked', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    const receipt = client.sendTransaction({
      to: lockedInvoice.address,
      value: 10n,
    });
    await expect(receipt).to.be.revertedWithCustomError(invoice, 'Locked');
  });

  it('Should accept receive and convert to wrapped token', async function () {
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );
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
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );

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
    ).to.be.revertedWithCustomError(invoice, 'NotParty');
  });

  it('Should revert addMilestones if locked', async function () {
    const lockedInvoice = await getLockedUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );

    await expect(
      lockedInvoice.write.addMilestones([[13n, 14n]]),
    ).to.be.revertedWithCustomError(invoice, 'Locked');
  });

  it('Should revert addMilestones if terminationTime passed', async function () {
    const currentTime = await currentTimestamp();
    const tx = await createUpdatableV2Escrow(
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
      getAddress(providerReceiver.account.address),
      getAddress(clientReceiver.account.address),
    );
    await testClient.increaseTime({ seconds: 1000 });
    invoiceAddress = await awaitInvoiceAddress(tx);
    invoice = await viem.getContractAt(
      'SmartInvoiceUpdatableV2',
      invoiceAddress!,
    );

    await expect(
      invoice.write.addMilestones([[13n, 14n]]),
    ).to.be.revertedWithCustomError(invoice, 'Terminated');
  });

  it('Should revert addMilestones if milestones array length is not between 1-10', async function () {
    await expect(
      invoice.write.addMilestones([[]], { account: client.account }),
    ).to.be.revertedWithCustomError(invoice, 'NoMilestones');
    await expect(
      invoice.write.addMilestones(
        [[1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n]],
        { account: client.account },
      ),
    ).to.be.revertedWithCustomError(invoice, 'ExceedsMilestoneLimit');
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

  // UPDATABLE TESTS
  it('Should allow the client to update their address', async function () {
    await invoice.write.updateClient([client2.account.address], {
      account: client.account,
    });
    expect(await invoice.read.client()).to.equal(
      getAddress(client2.account.address),
    );
  });

  it('Should revert the client update if not the client', async function () {
    await expect(
      invoice.write.updateClient([client2.account.address], {
        account: provider.account,
      }),
    ).to.be.reverted;
  });

  it('Should allow the client to update their receiving address', async function () {
    await invoice.write.updateClientReceiver(
      [clientReceiver2.account.address],
      {
        account: client.account,
      },
    );
    expect(await invoice.read.clientReceiver()).to.equal(
      getAddress(clientReceiver2.account.address),
    );
  });

  it('Should revert the clientReceiver update if not the client', async function () {
    await expect(
      invoice.write.updateClientReceiver([clientReceiver2.account.address], {
        account: provider.account,
      }),
    ).to.be.reverted;
  });

  it('Should allow the provider to update their receiving address', async function () {
    await invoice.write.updateProviderReceiver(
      [providerReceiver2.account.address],
      { account: provider.account },
    );
    expect(await invoice.read.providerReceiver()).to.equal(
      getAddress(providerReceiver2.account.address),
    );
  });

  it('Should revert the providerReceiver update if not provider', async function () {
    await expect(
      invoice.write.updateProviderReceiver(
        [providerReceiver2.account.address],
        { account: client.account },
      ),
    ).to.be.reverted;
  });

  it('Should allow the provider to update their address', async function () {
    await invoice.write.updateProvider([provider2.account.address], {
      account: provider.account,
    });
    expect(await invoice.read.provider()).to.equal(
      getAddress(provider2.account.address),
    );
  });

  it('Should revert the provider update if not the provider', async function () {
    await expect(
      invoice.write.updateProvider([provider2.account.address], {
        account: client.account,
      }),
    ).to.be.reverted;
  });
});

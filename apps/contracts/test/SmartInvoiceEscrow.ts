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
  let providerReceiver: WalletClient;
  let clientReceiver: WalletClient;
  let client2: WalletClient;
  let provider2: WalletClient;
  let providerReceiver2: WalletClient;
  let clientReceiver2: WalletClient;
  let publicClient: PublicClient;
  let testClient: TestClient;
  let invoiceAddress: Hex | null;

  beforeEach(async function () {
    const walletClients = await viem.getWalletClients();
    [
      client,
      provider,
      resolver,
      randomSigner,
      providerReceiver,
      clientReceiver,
      client2,
      provider2,
      providerReceiver2,
      clientReceiver2,
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
    const invoiceImpl = await viem.deployContract('SmartInvoiceEscrow');

    await factory.write.addImplementation([invoiceType, invoiceImpl.address]);

    // Create basic escrow without receiver addresses (optional)
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
        zeroAddress, // no providerReceiver
        zeroAddress, // no clientReceiver
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

  describe('Basic Functionality', function () {
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
      expect(await invoice.read.providerReceiver()).to.equal(zeroAddress);
      expect(await invoice.read.clientReceiver()).to.equal(zeroAddress);
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
      await expect(receipt).to.be.revertedWithCustomError(
        newInvoice,
        'InvalidInitialization',
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
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'InvalidClient',
      );
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
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'InvalidProvider',
      );
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
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'InvalidResolver',
      );
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
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'InvalidToken',
      );
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
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'InvalidWrappedNativeToken',
      );
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
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'DurationEnded',
      );
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
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'DurationTooLong',
      );
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
      await expect(receipt).to.revertedWithCustomError(
        invoice,
        'InvalidResolverType',
      );
    });
  });

  describe('Release Operations', function () {
    it('Should revert release by non client', async function () {
      await expect(
        invoice.write.release({ account: provider.account }),
      ).to.be.revertedWithCustomError(invoice, 'NotClient');
    });

    it('Should revert release with low balance', async function () {
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

    it('Should release with milestone number', async function () {
      await setBalanceOf(mockToken, invoice.address, 10);
      const receipt = await invoice.write.release([0n]);
      expect(await invoice.read.released()).to.equal(10);
      expect(await invoice.read.milestone()).to.equal(1);
      await expect(receipt).to.emit(invoice, 'Release').withArgs(0, 10);
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
      expect(lockedInvoice.write.release()).to.be.revertedWithCustomError(
        invoice,
        'Locked',
      );
    });
  });

  describe('Withdraw Operations', function () {
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
      await expect(receipt).to.revertedWithCustomError(invoice, 'Terminated');
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
  });

  describe('Lock and Resolve Operations', function () {
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
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'BalanceIsZero',
      );
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
  });

  describe('Arbitration Operations', function () {
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
  });

  describe('Native Token Operations', function () {
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
  });

  describe('Verification', function () {
    it('Should emit Verified when client calls verify()', async function () {
      await expect(invoice.write.verify({ account: client.account }))
        .to.emit(invoice, 'Verified')
        .withArgs(getAddress(client.account.address), invoice.address);
    });

    it('Should not emit Verified if caller !client', async function () {
      await expect(invoice.write.verify({ account: randomSigner.account })).to.be
        .reverted;
    });
  });

  describe('Milestone Management', function () {
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

    it('Should revert addMilestones if executed by non-client/non-provider', async function () {
      await expect(
        invoice.write.addMilestones([[13n, 14n]], {
          account: randomSigner.account,
        }),
      ).to.be.revertedWithCustomError(invoice, 'NotParty');
    });
  });

  describe('Address Update Functionality', function () {
    let updatableInvoice: ContractTypesMap['SmartInvoiceEscrow'];

    beforeEach(async function () {
      // Create invoice with receiver addresses
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
      updatableInvoice = await viem.getContractAt('SmartInvoiceEscrow', address!);
    });

    it('Should deploy with receiver addresses', async function () {
      expect(await updatableInvoice.read.providerReceiver()).to.equal(
        getAddress(providerReceiver.account.address),
      );
      expect(await updatableInvoice.read.clientReceiver()).to.equal(
        getAddress(clientReceiver.account.address),
      );
    });

    it('Should allow the client to update their address', async function () {
      await updatableInvoice.write.updateClient([client2.account.address], {
        account: client.account,
      });
      expect(await updatableInvoice.read.client()).to.equal(
        getAddress(client2.account.address),
      );
    });

    it('Should revert the client update if not the client', async function () {
      await expect(
        updatableInvoice.write.updateClient([client2.account.address], {
          account: provider.account,
        }),
      ).to.be.reverted;
    });

    it('Should allow the provider to update their address', async function () {
      await updatableInvoice.write.updateProvider([provider2.account.address], {
        account: provider.account,
      });
      expect(await updatableInvoice.read.provider()).to.equal(
        getAddress(provider2.account.address),
      );
    });

    it('Should allow the provider to update their receiving address', async function () {
      await updatableInvoice.write.updateProviderReceiver(
        [providerReceiver2.account.address],
        { account: provider.account },
      );
      expect(await updatableInvoice.read.providerReceiver()).to.equal(
        getAddress(providerReceiver2.account.address),
      );
    });

    it('Should allow the client to update their receiving address', async function () {
      await updatableInvoice.write.updateClientReceiver(
        [clientReceiver2.account.address],
        {
          account: client.account,
        },
      );
      expect(await updatableInvoice.read.clientReceiver()).to.equal(
        getAddress(clientReceiver2.account.address),
      );
    });

    it('Should send payments to providerReceiver when set', async function () {
      await setBalanceOf(mockToken, updatableInvoice.address, 10);
      const beforeBalance = await getBalanceOf(
        mockToken,
        providerReceiver.account.address,
      );
      await updatableInvoice.write.release({ account: client.account });
      const afterBalance = await getBalanceOf(
        mockToken,
        providerReceiver.account.address,
      );
      expect(afterBalance).to.equal(beforeBalance + 10n);
    });

    it('Should send withdrawals to clientReceiver when set', async function () {
      const currentTime = await currentTimestamp();
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
          BigInt(currentTime + 1000),
          zeroHash,
          mockWrappedNativeToken,
          false,
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
      const tempInvoice = await viem.getContractAt('SmartInvoiceEscrow', address!);

      await testClient.increaseTime({ seconds: 1000 });
      await setBalanceOf(mockToken, tempInvoice.address, 10);

      const beforeBalance = await getBalanceOf(
        mockToken,
        clientReceiver.account.address,
      );
      await tempInvoice.write.withdraw({ account: client.account });
      const afterBalance = await getBalanceOf(
        mockToken,
        clientReceiver.account.address,
      );
      expect(afterBalance).to.equal(beforeBalance + 10n);
    });

    it('Should send payments to updated providerReceiver after address change', async function () {
      // First update the provider receiver to providerReceiver2
      await updatableInvoice.write.updateProviderReceiver(
        [providerReceiver2.account.address],
        { account: provider.account },
      );

      await setBalanceOf(mockToken, updatableInvoice.address, 10);
      
      const beforeBalance = await getBalanceOf(
        mockToken,
        providerReceiver2.account.address,
      );
      const beforeOriginalBalance = await getBalanceOf(
        mockToken,
        providerReceiver.account.address,
      );
      
      await updatableInvoice.write.release({ account: client.account });
      
      const afterBalance = await getBalanceOf(
        mockToken,
        providerReceiver2.account.address,
      );
      const afterOriginalBalance = await getBalanceOf(
        mockToken,
        providerReceiver.account.address,
      );
      
      // Payment should go to the NEW receiver
      expect(afterBalance).to.equal(beforeBalance + 10n);
      // Original receiver should not receive anything
      expect(afterOriginalBalance).to.equal(beforeOriginalBalance);
    });

    it('Should send withdrawals to updated clientReceiver after address change', async function () {
      const currentTime = await currentTimestamp();
      
      // Create a new invoice with short termination time for withdrawal testing
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
          BigInt(currentTime + 1000),
          zeroHash,
          mockWrappedNativeToken,
          false,
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
      const tempInvoice = await viem.getContractAt('SmartInvoiceEscrow', address!);

      // Update client receiver to clientReceiver2
      await tempInvoice.write.updateClientReceiver(
        [clientReceiver2.account.address],
        { account: client.account },
      );

      await testClient.increaseTime({ seconds: 1000 });
      await setBalanceOf(mockToken, tempInvoice.address, 10);

      const beforeBalance = await getBalanceOf(
        mockToken,
        clientReceiver2.account.address,
      );
      const beforeOriginalBalance = await getBalanceOf(
        mockToken,
        clientReceiver.account.address,
      );
      
      await tempInvoice.write.withdraw({ account: client.account });
      
      const afterBalance = await getBalanceOf(
        mockToken,
        clientReceiver2.account.address,
      );
      const afterOriginalBalance = await getBalanceOf(
        mockToken,
        clientReceiver.account.address,
      );
      
      // Withdrawal should go to the NEW receiver
      expect(afterBalance).to.equal(beforeBalance + 10n);
      // Original receiver should not receive anything
      expect(afterOriginalBalance).to.equal(beforeOriginalBalance);
    });
  });
});
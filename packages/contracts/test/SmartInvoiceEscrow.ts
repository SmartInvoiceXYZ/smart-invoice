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
  toBytes,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem';

import {
  awaitInvoiceAddress,
  createEscrow,
  currentTimestamp,
  encodeInitData,
  getBalanceOf,
  getLockedEscrow,
  setBalanceOf,
} from './utils';

const individualResolverType = 0;
const arbitratorResolverType = 1;
const amounts = [BigInt(10), BigInt(10)];
const total = amounts.reduce((t, v) => t + v, BigInt(0));
let terminationTime =
  Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60;
const resolutionRateBPS = 500n; // 5%
const requireVerification = true;
const invoiceType = toHex(toBytes('escrow-v3', { size: 32 }));

describe('SmartInvoiceEscrow', function () {
  let factory: ContractTypesMap['SmartInvoiceFactory'];
  let invoice: ContractTypesMap['SmartInvoiceEscrow'];
  let mockToken: Hex;
  let mockWrappedETHContract: ContractTypesMap['MockWETH'];
  let mockWrappedETH: Hex;
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

    mockWrappedETHContract = await viem.deployContract('MockWETH');
    mockWrappedETH = getAddress(mockWrappedETHContract.address);

    mockArbitratorContract = await viem.deployContract('MockArbitrator', [10n]);
    mockArbitrator = getAddress(mockArbitratorContract.address);

    factory = await viem.deployContract('SmartInvoiceFactory', [
      mockWrappedETH,
    ]);
    const invoiceImpl = await viem.deployContract('SmartInvoiceEscrow', [
      mockWrappedETH,
      factory.address,
    ]);

    await factory.write.addImplementation([invoiceType, invoiceImpl.address]);

    terminationTime = (await currentTimestamp()) + 30 * 24 * 60 * 60;

    // Create basic escrow using InitData struct
    const data = encodeAbiParameters(
      [
        {
          type: 'tuple',
          name: 'initData',
          components: [
            { name: 'client', type: 'address' },
            { name: 'resolverType', type: 'uint8' },
            { name: 'resolver', type: 'address' },
            { name: 'token', type: 'address' },
            { name: 'terminationTime', type: 'uint256' },
            { name: 'requireVerification', type: 'bool' },
            { name: 'providerReceiver', type: 'address' },
            { name: 'clientReceiver', type: 'address' },
            { name: 'feeBPS', type: 'uint256' },
            { name: 'treasury', type: 'address' },
            { name: 'details', type: 'string' },
          ],
        },
      ],
      [
        {
          client: getAddress(client.account.address),
          resolverType: individualResolverType,
          resolver: getAddress(resolver.account.address),
          token: mockToken,
          terminationTime: BigInt(terminationTime),
          requireVerification,
          providerReceiver: zeroAddress, // no providerReceiver
          clientReceiver: zeroAddress, // no clientReceiver
          feeBPS: 0n, // no fees
          treasury: zeroAddress, // no treasury needed when feeBPS is 0
          details: '',
        },
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
      expect(await invoice.read.resolverType()).to.equal(
        individualResolverType,
      );
      expect(await invoice.read.resolver()).to.equal(
        getAddress(resolver.account.address),
      );
      expect(await invoice.read.token()).to.equal(mockToken);

      for (let i = 0; i < amounts.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        expect(await invoice.read.amounts([BigInt(i)])).to.equal(amounts[i]);
      }
      expect(await invoice.read.terminationTime()).to.equal(terminationTime);
      expect(await invoice.read.resolutionRateBPS()).to.equal(
        resolutionRateBPS,
      );
      expect(await invoice.read.milestone()).to.equal(0n);
      expect(await invoice.read.total()).to.equal(total);
      expect(await invoice.read.locked()).to.equal(false);
      expect(await invoice.read.disputeId()).to.equal(0n);
      expect(await invoice.read.WRAPPED_ETH()).to.equal(mockWrappedETH);
      expect(await invoice.read.providerReceiver()).to.equal(zeroAddress);
      expect(await invoice.read.clientReceiver()).to.equal(zeroAddress);
    });

    it('Should emit InvoiceInit event during deployment', async function () {
      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: 'Test invoice details',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const newInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      await expect(hash)
        .to.emit(newInvoice, 'InvoiceInit')
        .withArgs(
          getAddress(provider.account.address),
          getAddress(client.account.address),
          amounts,
          'Test invoice details',
        );

      // Verify the invoice was created properly
      expect(await newInvoice.read.client()).to.equal(
        getAddress(client.account.address),
      );
      expect(await newInvoice.read.provider()).to.equal(
        getAddress(provider.account.address),
      );
    });

    it('Should emit MetaEvidence event during deployment', async function () {
      const details = 'MetaEvidence test details';
      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details,
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const newInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      // Verify the MetaEvidence ID was set correctly
      expect(await newInvoice.read.metaEvidenceId()).to.equal(0);

      await expect(hash)
        .to.emit(newInvoice, 'MetaEvidence')
        .withArgs(0, details);
    });

    it('Should emit Verified event when requireVerification is false', async function () {
      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification: false, // Auto-verify
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);

      const newInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      await expect(hash)
        .to.emit(newInvoice, 'InvoiceInit')
        .withArgs(
          getAddress(provider.account.address),
          getAddress(client.account.address),
          amounts,
          '',
        );
      await expect(hash)
        .to.emit(newInvoice, 'Verified')
        .withArgs(getAddress(client.account.address), getAddress(address!));
    });

    it('Should revert init if invalid params', async function () {
      const currentTime = await currentTimestamp();
      const newInvoice = await viem.deployContract('SmartInvoiceEscrow', [
        mockWrappedETH,
        factory.address,
      ]);

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
          mockWrappedETH,
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
        requireVerification,
      );
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'InvalidToken',
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
        requireVerification,
      );
      const invoiceAddr = await awaitInvoiceAddress(tx);
      const deployedInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        invoiceAddr!,
      );
      expect(await deployedInvoice.read.resolutionRateBPS()).to.equal(
        resolutionRateBPS,
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
        requireVerification,
      );
      await expect(receipt).to.revertedWithCustomError(
        invoice,
        'InvalidResolverType',
      );
    });
  });

  describe('Funding Status', function () {
    it('Should return false for isFullyFunded when no funds deposited', async function () {
      expect(await invoice.read.isFullyFunded()).to.equal(false);
    });

    it('Should return true for isFullyFunded when fully funded', async function () {
      await setBalanceOf(mockToken, invoiceAddress!, total);
      expect(await invoice.read.isFullyFunded()).to.equal(true);
    });

    it('Should return true for isFullyFunded after partial release when total funds available', async function () {
      // Fund the contract with total amount
      await setBalanceOf(mockToken, invoiceAddress!, total);

      // Release first milestone
      await invoice.write.release({ account: client.account });

      // Should still be considered fully funded since released + balance >= total
      expect(await invoice.read.isFullyFunded()).to.equal(true);
    });

    it('Should return false for isFunded when milestone out of bounds', async function () {
      await expect(invoice.read.isFunded([999n])).to.be.revertedWithCustomError(
        invoice,
        'InvalidMilestone',
      );
    });

    it('Should return false for isFunded when insufficient funds for milestone', async function () {
      // Don't fund the contract
      expect(await invoice.read.isFunded([0n])).to.equal(false);
    });

    it('Should return true for isFunded when sufficient funds for specific milestone', async function () {
      // Fund with enough for first milestone
      await setBalanceOf(mockToken, invoiceAddress!, amounts[0]);
      expect(await invoice.read.isFunded([0n])).to.equal(true);
    });

    it('Should return true for isFunded when checking past milestones', async function () {
      // Fund and release first milestone
      await setBalanceOf(mockToken, invoiceAddress!, total);
      await invoice.write.release({ account: client.account });

      // Should return true for milestone 0 since it's already released
      expect(await invoice.read.isFunded([0n])).to.equal(true);
    });

    it('Should correctly calculate required amount for future milestones', async function () {
      // Fund with enough for first two milestones
      const requiredForTwo = amounts[0] + amounts[1];
      await setBalanceOf(mockToken, invoiceAddress!, requiredForTwo);

      expect(await invoice.read.isFunded([0n])).to.equal(true);
      expect(await invoice.read.isFunded([1n])).to.equal(true);
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

    it('Should auto-verify client on first release() call', async function () {
      // Ensure invoice starts unverified since requireVerification is true
      expect(await invoice.read.verified()).to.equal(false);

      await setBalanceOf(mockToken, invoice.address, 10);
      const receipt = await invoice.write.release();

      // Should emit both Verified and Release events
      await expect(receipt)
        .to.emit(invoice, 'Verified')
        .withArgs(getAddress(client.account.address), invoice.address);
      await expect(receipt).to.emit(invoice, 'Release').withArgs(0, 10);

      // Should now be verified
      expect(await invoice.read.verified()).to.equal(true);

      // Subsequent releases should not emit Verified event again
      await setBalanceOf(mockToken, invoice.address, 10);
      const receipt2 = await invoice.write.release();
      await expect(receipt2).to.not.emit(invoice, 'Verified');
      await expect(receipt2).to.emit(invoice, 'Release').withArgs(1, 10);
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

    it('Should auto-verify client on first release(milestone) call', async function () {
      // Create a fresh invoice for this test to ensure unverified state
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
        currentTime + 30 * 24 * 60 * 60,
        zeroHash,
        true, // requireVerification = true
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      // Ensure invoice starts unverified
      expect(await tempInvoice.read.verified()).to.equal(false);

      await setBalanceOf(mockToken, tempInvoice.address, 10);
      const receipt = await tempInvoice.write.release([0n], {
        account: client.account,
      });

      // Should emit both Verified and Release events
      await expect(receipt)
        .to.emit(tempInvoice, 'Verified')
        .withArgs(getAddress(client.account.address), tempInvoice.address);
      await expect(receipt).to.emit(tempInvoice, 'Release').withArgs(0, 10);

      // Should now be verified
      expect(await tempInvoice.read.verified()).to.equal(true);
    });

    it('Should revert release milestone below current', async function () {
      await setBalanceOf(mockToken, invoice.address, 10);
      await invoice.write.release([0n]); // Release milestone 0

      // Try to release milestone 0 again
      await expect(invoice.write.release([0n])).to.be.revertedWithCustomError(
        invoice,
        'InvalidMilestone',
      );
    });

    it('Should revert release milestone above max', async function () {
      await setBalanceOf(mockToken, invoice.address, 10);

      // Try to release milestone beyond array length
      await expect(invoice.write.release([5n])).to.be.revertedWithCustomError(
        invoice,
        'InvalidMilestone',
      );
    });

    it('Should release remaining balance after all milestones', async function () {
      // Complete all milestones first
      await setBalanceOf(mockToken, invoice.address, 20);
      await invoice.write.release([1n]); // Release both milestones
      expect(await invoice.read.milestone()).to.equal(2);

      // Add more tokens and release remaining
      await setBalanceOf(mockToken, invoice.address, 5);
      const receipt = await invoice.write.release();
      await expect(receipt).to.emit(invoice, 'ReleaseRemainder').withArgs(5);
    });

    it('Should revert release remaining balance when zero', async function () {
      // Complete all milestones first
      await setBalanceOf(mockToken, invoice.address, 20);
      await invoice.write.release([1n]); // Release both milestones

      // Try to release when no balance
      await expect(invoice.write.release()).to.be.revertedWithCustomError(
        invoice,
        'BalanceIsZero',
      );
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
        mockWrappedETH,
      );
      expect(lockedInvoice.write.release()).to.be.revertedWithCustomError(
        invoice,
        'Locked',
      );
    });
  });

  describe('Token Release and Withdraw Operations', function () {
    let mockToken2: Hex;
    let mockToken2Contract: ContractTypesMap['MockToken'];

    beforeEach(async function () {
      mockToken2Contract = await viem.deployContract('MockToken');
      mockToken2 = getAddress(mockToken2Contract.address);
    });

    it('Should releaseTokens for main token (same as release)', async function () {
      await setBalanceOf(mockToken, invoice.address, 10);
      const beforeBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );
      await invoice.write.releaseTokens([mockToken]);
      expect(await invoice.read.released()).to.equal(10);
      expect(await invoice.read.milestone()).to.equal(1);
      const afterBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );
      expect(afterBalance).to.equal(beforeBalance + 10n);
    });

    it('Should releaseTokens for different token (full balance)', async function () {
      await setBalanceOf(mockToken2, invoice.address, 50);
      const beforeBalance = await getBalanceOf(
        mockToken2,
        provider.account.address,
      );
      await invoice.write.releaseTokens([mockToken2]);
      // Should not affect main token milestone
      expect(await invoice.read.milestone()).to.equal(0);
      const afterBalance = await getBalanceOf(
        mockToken2,
        provider.account.address,
      );
      expect(afterBalance).to.equal(beforeBalance + 50n);
    });

    it('Should revert releaseTokens if locked', async function () {
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
        mockWrappedETH,
      );
      await expect(
        lockedInvoice.write.releaseTokens([mockToken2]),
      ).to.be.revertedWithCustomError(invoice, 'Locked');
    });

    it('Should revert releaseTokens by non-client', async function () {
      await expect(
        invoice.write.releaseTokens([mockToken2], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(invoice, 'NotClient');
    });

    it('Should withdrawTokens for main token after termination', async function () {
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
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await testClient.increaseTime({ seconds: 1000 });
      await setBalanceOf(mockToken, tempInvoice.address, 10);

      await tempInvoice.write.withdrawTokens([mockToken]);
      expect(await tempInvoice.read.milestone()).to.equal(2);
    });

    it('Should withdrawTokens for different token after termination', async function () {
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
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await testClient.increaseTime({ seconds: 1000 });
      await setBalanceOf(mockToken2, tempInvoice.address, 25);

      const beforeBalance = await getBalanceOf(
        mockToken2,
        client.account.address,
      );
      await tempInvoice.write.withdrawTokens([mockToken2]);
      const afterBalance = await getBalanceOf(
        mockToken2,
        client.account.address,
      );
      expect(afterBalance).to.equal(beforeBalance + 25n);
    });

    it('Should revert withdrawTokens before termination', async function () {
      await expect(
        invoice.write.withdrawTokens([mockToken2]),
      ).to.be.revertedWithCustomError(invoice, 'NotTerminated');
    });

    it('Should revert withdrawTokens if locked', async function () {
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
        mockWrappedETH,
      );
      await testClient.increaseTime({ seconds: terminationTime + 1000 });
      await expect(
        lockedInvoice.write.withdrawTokens([mockToken2]),
      ).to.be.revertedWithCustomError(invoice, 'Locked');
    });

    it('Should revert withdrawTokens with zero balance', async function () {
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
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await testClient.increaseTime({ seconds: 1000 });
      // Don't set any balance for mockToken2

      await expect(
        tempInvoice.write.withdrawTokens([mockToken2]),
      ).to.be.revertedWithCustomError(invoice, 'BalanceIsZero');
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
        requireVerification,
      );
      invoiceAddress = await awaitInvoiceAddress(tx);
      invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

      const receipt = invoice.write.withdraw();
      await expect(receipt).to.revertedWithCustomError(
        invoice,
        'NotTerminated',
      );
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

    it('Should revert withdraw with zero balance', async function () {
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
        requireVerification,
      );
      invoiceAddress = await awaitInvoiceAddress(tx);
      invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

      await testClient.increaseTime({ seconds: 1000 });
      // Don't set any balance

      await expect(invoice.write.withdraw()).to.be.revertedWithCustomError(
        invoice,
        'BalanceIsZero',
      );
    });

    it('Should revert withdraw if locked', async function () {
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
        mockWrappedETH,
      );
      await testClient.increaseTime({ seconds: terminationTime + 1000 });
      await expect(
        lockedInvoice.write.withdraw(),
      ).to.be.revertedWithCustomError(invoice, 'Locked');
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
        mockWrappedETH,
      );
      expect(await lockedInvoice.read.locked()).to.equal(true);
    });

    it('Should emit Lock event by client', async function () {
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
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await setBalanceOf(mockToken, tempInvoice.address, 10);
      const disputeURI = 'ipfs://dispute-details';

      const receipt = await tempInvoice.write.lock([disputeURI], {
        account: client.account,
      });

      await expect(receipt)
        .to.emit(tempInvoice, 'Lock')
        .withArgs(getAddress(client.account.address), disputeURI);
    });

    it('Should emit Lock event by provider', async function () {
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
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await setBalanceOf(mockToken, tempInvoice.address, 10);
      const disputeURI = 'ipfs://provider-dispute';

      const receipt = await tempInvoice.write.lock([disputeURI], {
        account: provider.account,
      });

      await expect(receipt)
        .to.emit(tempInvoice, 'Lock')
        .withArgs(getAddress(provider.account.address), disputeURI);
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
        mockWrappedETH,
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
        mockWrappedETH,
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
        mockWrappedETH,
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

    it('Should rule 0:1 for ruling 2', async function () {
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
        mockWrappedETH,
        10n,
      );

      await setBalanceOf(mockToken, lockedInvoice.address, 100);
      const receipt = await mockArbitratorContract.write.executeRuling([
        lockedInvoice.address,
        2n,
      ]);
      await expect(receipt)
        .to.emit(lockedInvoice, 'Rule')
        .withArgs(mockArbitrator, 0, 100, 2);
      await expect(receipt)
        .to.emit(lockedInvoice, 'Ruling')
        .withArgs(mockArbitrator, 1, 2);
    });

    it('Should revert rule with invalid ruling', async function () {
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
        mockWrappedETH,
        10n,
      );

      await setBalanceOf(mockToken, lockedInvoice.address, 100);
      await expect(
        mockArbitratorContract.write.executeRuling([
          lockedInvoice.address,
          5n, // Invalid ruling > NUM_RULING_OPTIONS
        ]),
      ).to.be.revertedWithCustomError(lockedInvoice, 'InvalidRuling');
    });

    it('Should revert rule if not arbitrator resolver', async function () {
      const lockedInvoice = await getLockedEscrow(
        factory,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        individualResolverType, // Individual resolver, not arbitrator
        resolver.account.address,
        mockToken,
        amounts,
        zeroHash,
        mockWrappedETH,
      );

      await expect(
        lockedInvoice.write.rule([1n, 1n], { account: resolver.account }),
      ).to.be.revertedWithCustomError(
        lockedInvoice,
        'InvalidArbitratorResolver',
      );
    });

    it('Should revert rule if not locked', async function () {
      const currentTime = await currentTimestamp();
      const tx = await createEscrow(
        factory,
        invoice,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        arbitratorResolverType,
        mockArbitrator,
        mockToken,
        amounts,
        currentTime + 3600,
        zeroHash,
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const regularInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await setBalanceOf(mockToken, regularInvoice.address, 10);

      // Create a mock dispute so executeRuling doesn't fail with DisputeNotFound
      await mockArbitratorContract.write.createMockDispute([
        regularInvoice.address,
        2n,
      ]);

      await expect(
        mockArbitratorContract.write.executeRuling([
          regularInvoice.address,
          1n,
        ]),
      ).to.be.revertedWithCustomError(regularInvoice, 'NotLocked');
    });

    it('Should revert rule from non-resolver', async function () {
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
        mockWrappedETH,
        10n,
      );

      await expect(
        lockedInvoice.write.rule([1n, 1n], { account: client.account }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'NotResolver');
    });

    it('Should revert rule with wrong dispute ID', async function () {
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
        mockWrappedETH,
        10n,
      );

      await expect(
        mockArbitratorContract.write.executeWrongRuling([
          lockedInvoice.address,
          999n, // Wrong dispute ID
          1n,
        ]),
      ).to.be.revertedWithCustomError(lockedInvoice, 'IncorrectDisputeId');
    });

    it('Should revert rule with zero balance', async function () {
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
        mockWrappedETH,
        10n,
      );

      await setBalanceOf(mockToken, lockedInvoice.address, 0);

      await expect(
        mockArbitratorContract.write.executeRuling([lockedInvoice.address, 1n]),
      ).to.be.revertedWithCustomError(lockedInvoice, 'BalanceIsZero');
    });
  });

  describe('Evidence and Appeal Operations', function () {
    it('Should allow client to submit evidence', async function () {
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
        mockWrappedETH,
        10n,
      );

      const evidenceURI = 'ipfs://evidence-hash';
      const receipt = await lockedInvoice.write.submitEvidence([evidenceURI], {
        account: client.account,
      });

      await expect(receipt).to.emit(lockedInvoice, 'Evidence').withArgs(
        mockArbitrator,
        1, // evidenceGroupId
        getAddress(client.account.address),
        evidenceURI,
      );
    });

    it('Should allow provider to submit evidence', async function () {
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
        mockWrappedETH,
        10n,
      );

      const evidenceURI = 'ipfs://provider-evidence';
      const receipt = await lockedInvoice.write.submitEvidence([evidenceURI], {
        account: provider.account,
      });

      await expect(receipt).to.emit(lockedInvoice, 'Evidence').withArgs(
        mockArbitrator,
        1, // evidenceGroupId
        getAddress(provider.account.address),
        evidenceURI,
      );
    });

    it('Should revert evidence submission by non-party', async function () {
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
        mockWrappedETH,
        10n,
      );

      await expect(
        lockedInvoice.write.submitEvidence(['ipfs://evidence'], {
          account: randomSigner.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'NotParty');
    });

    it('Should revert evidence submission if not locked', async function () {
      const currentTime = await currentTimestamp();
      const tx = await createEscrow(
        factory,
        invoice,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        arbitratorResolverType,
        mockArbitrator,
        mockToken,
        amounts,
        currentTime + 3600,
        zeroHash,
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const regularInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await setBalanceOf(mockToken, regularInvoice.address, 10);

      await expect(
        regularInvoice.write.submitEvidence(['ipfs://evidence'], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(regularInvoice, 'NotLocked');
    });

    it('Should revert evidence submission for individual resolver', async function () {
      const lockedInvoice = await getLockedEscrow(
        factory,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        individualResolverType, // Individual resolver
        resolver.account.address,
        mockToken,
        amounts,
        zeroHash,
        mockWrappedETH,
      );

      await expect(
        lockedInvoice.write.submitEvidence(['ipfs://evidence'], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(
        lockedInvoice,
        'InvalidArbitratorResolver',
      );
    });

    it('Should allow client to appeal', async function () {
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
        mockWrappedETH,
        10n,
      );

      // Make the dispute appealable
      const disputeId = await lockedInvoice.read.disputeId();
      await mockArbitratorContract.write.setAppealable([disputeId, 1n]);

      const appealURI = 'ipfs://appeal-hash';
      const receipt = await lockedInvoice.write.appeal([appealURI], {
        account: client.account,
        value: 20n, // Appeal cost
      });

      await expect(receipt)
        .to.emit(lockedInvoice, 'DisputeAppealed')
        .withArgs(getAddress(client.account.address), appealURI);
    });

    it('Should allow provider to appeal', async function () {
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
        mockWrappedETH,
        10n,
      );

      // Make the dispute appealable
      const disputeId = await lockedInvoice.read.disputeId();
      await mockArbitratorContract.write.setAppealable([disputeId, 1n]);

      const appealURI = 'ipfs://provider-appeal';
      const receipt = await lockedInvoice.write.appeal([appealURI], {
        account: provider.account,
        value: 20n, // Appeal cost
      });

      await expect(receipt)
        .to.emit(lockedInvoice, 'DisputeAppealed')
        .withArgs(getAddress(provider.account.address), appealURI);
    });

    it('Should revert appeal by non-party', async function () {
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
        mockWrappedETH,
        10n,
      );

      await expect(
        lockedInvoice.write.appeal(['ipfs://appeal'], {
          account: randomSigner.account,
          value: 20n,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'NotParty');
    });

    it('Should revert appeal if not locked', async function () {
      const currentTime = await currentTimestamp();
      const tx = await createEscrow(
        factory,
        invoice,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        arbitratorResolverType,
        mockArbitrator,
        mockToken,
        amounts,
        currentTime + 3600,
        zeroHash,
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const regularInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await setBalanceOf(mockToken, regularInvoice.address, 10);

      await expect(
        regularInvoice.write.appeal(['ipfs://appeal'], {
          account: client.account,
          value: 20n,
        }),
      ).to.be.revertedWithCustomError(regularInvoice, 'NotLocked');
    });

    it('Should revert appeal for individual resolver', async function () {
      const lockedInvoice = await getLockedEscrow(
        factory,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        individualResolverType, // Individual resolver
        resolver.account.address,
        mockToken,
        amounts,
        zeroHash,
        mockWrappedETH,
      );

      await expect(
        lockedInvoice.write.appeal(['ipfs://appeal'], {
          account: client.account,
          value: 20n,
        }),
      ).to.be.revertedWithCustomError(
        lockedInvoice,
        'InvalidArbitratorResolver',
      );
    });
  });

  describe('ETH Operations', function () {
    it('Should revert receive if not wrappedETH', async function () {
      const receipt = client.sendTransaction({
        to: invoice.address,
        value: 10n,
      });
      await expect(receipt).to.be.revertedWithCustomError(
        invoice,
        'InvalidWrappedETH',
      );
    });

    it('Should revert receive if locked', async function () {
      const lockedInvoice = await getLockedEscrow(
        factory,
        invoiceType,
        client.account.address,
        provider.account.address,
        individualResolverType,
        resolver.account.address,
        mockWrappedETH, // Using wrapped ETH
        amounts,
        zeroHash,
        mockWrappedETH,
      );

      const receipt = client.sendTransaction({
        to: lockedInvoice.address,
        value: 10n,
      });
      await expect(receipt).to.be.revertedWithCustomError(
        lockedInvoice,
        'Locked',
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
        mockWrappedETH,
        amounts,
        terminationTime,
        zeroHash,
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
        .withArgs(
          getAddress(client.account.address),
          10,
          getAddress(mockWrappedETH),
        );
      expect(
        await mockWrappedETHContract.read.balanceOf([invoice.address]),
      ).to.equal(10);
    });

    it('Should wrapETH from contract balance', async function () {
      const tx = await createEscrow(
        factory,
        invoice,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        individualResolverType,
        getAddress(resolver.account.address),
        mockWrappedETH,
        amounts,
        terminationTime,
        zeroHash,
        requireVerification,
      );
      invoiceAddress = await awaitInvoiceAddress(tx);
      invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

      // Simulate ETH received via self-destruct by manually sending ETH to mockWETH
      // then transferring it to invoice address to simulate contract ETH balance
      await client.sendTransaction({
        to: mockWrappedETHContract.address,
        value: 25n,
      });
      await mockWrappedETHContract.write.transfer([invoice.address, 25n]);

      // Now manually set the ETH balance on the invoice contract to simulate self-destruct
      await testClient.setBalance({
        address: invoice.address,
        value: 15n, // Set direct ETH balance
      });

      const beforeWrapBalance = await mockWrappedETHContract.read.balanceOf([
        invoice.address,
      ]);
      const receipt = await invoice.write.wrapETH();

      await expect(receipt).to.emit(invoice, 'WrappedStrayETH').withArgs(15);

      await expect(receipt)
        .to.emit(invoice, 'Deposit')
        .withArgs(invoice.address, 15, mockWrappedETH);

      const afterWrapBalance = await mockWrappedETHContract.read.balanceOf([
        invoice.address,
      ]);
      expect(afterWrapBalance).to.equal(beforeWrapBalance + 15n);
    });

    it('Should wrapETH without deposit event if not main token', async function () {
      const tx = await createEscrow(
        factory,
        invoice,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        individualResolverType,
        getAddress(resolver.account.address),
        mockToken, // Different token, not wrapped ETH
        amounts,
        terminationTime,
        zeroHash,
        requireVerification,
      );
      invoiceAddress = await awaitInvoiceAddress(tx);
      invoice = await viem.getContractAt('SmartInvoiceEscrow', invoiceAddress!);

      // Set ETH balance to wrap
      await testClient.setBalance({
        address: invoice.address,
        value: 20n,
      });

      const receipt = await invoice.write.wrapETH();

      await expect(receipt).to.emit(invoice, 'WrappedStrayETH').withArgs(20);

      // Should NOT emit Deposit event since token != WRAPPED_ETH
      await expect(receipt).not.to.emit(invoice, 'Deposit');
    });

    it('Should revert wrapETH if locked', async function () {
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
        mockWrappedETH,
      );

      await expect(lockedInvoice.write.wrapETH()).to.be.revertedWithCustomError(
        lockedInvoice,
        'Locked',
      );
    });

    it('Should revert wrapETH with zero balance', async function () {
      // Contract should have 0 ETH balance by default
      await expect(invoice.write.wrapETH()).to.be.revertedWithCustomError(
        invoice,
        'BalanceIsZero',
      );
    });
  });

  describe('Constructor Validation', function () {
    it('Should revert constructor with invalid wrapped ETH', async function () {
      await expect(
        viem.deployContract('SmartInvoiceEscrow', [
          zeroAddress,
          factory.address,
        ]),
      ).to.be.revertedWithCustomError(invoice, 'InvalidWrappedETH');
    });

    it('Should revert constructor with invalid factory', async function () {
      await expect(
        viem.deployContract('SmartInvoiceEscrow', [
          mockWrappedETH,
          zeroAddress,
        ]),
      ).to.be.revertedWithCustomError(invoice, 'InvalidFactory');
    });

    it('Should set immutable values correctly', async function () {
      const newInvoice = await viem.deployContract('SmartInvoiceEscrow', [
        mockWrappedETH,
        factory.address,
      ]);
      expect(await newInvoice.read.WRAPPED_ETH()).to.equal(mockWrappedETH);
      expect(await newInvoice.read.FACTORY()).to.equal(
        getAddress(factory.address),
      );
      expect(await newInvoice.read.VERSION()).to.equal('3.0.0');
      expect(await newInvoice.read.NUM_RULING_OPTIONS()).to.equal(2);
    });
  });

  describe('Verification', function () {
    it('Should emit Verified when client calls verify()', async function () {
      await expect(invoice.write.verify({ account: client.account }))
        .to.emit(invoice, 'Verified')
        .withArgs(getAddress(client.account.address), invoice.address);
    });

    it('Should not emit Verified if caller !client', async function () {
      await expect(invoice.write.verify({ account: randomSigner.account })).to
        .be.reverted;
    });
  });

  describe('Milestone Management', function () {
    it('Should addMilestones if client', async function () {
      const receipt = await invoice.write.addMilestones([[13n, 14n]]);
      expect((await invoice.read.getAmounts()).length).to.equal(4);
      expect(await invoice.read.amounts([0n])).to.equal(10n);
      expect(await invoice.read.amounts([1n])).to.equal(10n);
      expect(await invoice.read.amounts([2n])).to.equal(13n);
      expect(await invoice.read.amounts([3n])).to.equal(14n);
      await expect(receipt)
        .to.emit(invoice, 'MilestonesAdded')
        .withArgs(getAddress(client.account.address), invoice.address, [
          13n,
          14n,
        ]);
    });

    it('Should addMilestones if provider', async function () {
      const receipt = await invoice.write.addMilestones([[13n, 14n]], {
        account: provider.account,
      });
      expect((await invoice.read.getAmounts()).length).to.equal(4);
      expect(await invoice.read.amounts([0n])).to.equal(10n);
      expect(await invoice.read.amounts([1n])).to.equal(10n);
      expect(await invoice.read.amounts([2n])).to.equal(13n);
      expect(await invoice.read.amounts([3n])).to.equal(14n);
      await expect(receipt)
        .to.emit(invoice, 'MilestonesAdded')
        .withArgs(getAddress(provider.account.address), invoice.address, [
          13n,
          14n,
        ]);
    });

    it('Should addMilestones and update total with added milestones', async function () {
      await invoice.write.addMilestones([[13n, 14n]], {
        account: provider.account,
      });
      expect(await invoice.read.total()).to.equal(47);
    });

    it('Should addMilestones with details and emit MetaEvidence', async function () {
      const details = 'Updated milestone details';
      const receipt = await invoice.write.addMilestones([[15n], details], {
        account: client.account,
      });

      await expect(receipt)
        .to.emit(invoice, 'DetailsUpdated')
        .withArgs(getAddress(client.account.address), details);

      await expect(receipt)
        .to.emit(invoice, 'MetaEvidence')
        .withArgs(1, details); // metaEvidenceId should be 1 after first update

      expect(await invoice.read.metaEvidenceId()).to.equal(1);
    });

    it('Should increment metaEvidenceId on subsequent details updates', async function () {
      // First update
      await invoice.write.addMilestones([[15n], 'First update']);
      expect(await invoice.read.metaEvidenceId()).to.equal(1);

      // Second update
      await invoice.write.addMilestones([[16n], 'Second update']);
      expect(await invoice.read.metaEvidenceId()).to.equal(2);
    });

    it('Should revert addMilestones if executed by non-client/non-provider', async function () {
      await expect(
        invoice.write.addMilestones([[13n, 14n]], {
          account: randomSigner.account,
        }),
      ).to.be.revertedWithCustomError(invoice, 'NotParty');
    });

    it('Should revert addMilestones if locked', async function () {
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
        mockWrappedETH,
      );

      await expect(
        lockedInvoice.write.addMilestones([[15n]], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'Locked');
    });

    it('Should revert addMilestones after termination', async function () {
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
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await testClient.increaseTime({ seconds: 1000 });

      await expect(
        tempInvoice.write.addMilestones([[15n]], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(tempInvoice, 'Terminated');
    });

    it('Should revert addMilestones with empty array', async function () {
      await expect(
        invoice.write.addMilestones([[]], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(invoice, 'NoMilestones');
    });

    it('Should revert addMilestones exceeding max limit', async function () {
      // First, create an invoice with many milestones (close to limit)
      const manyAmounts = Array(48).fill(BigInt(1)); // 48 milestones
      const currentTime = await currentTimestamp();
      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(currentTime + 30 * 24 * 60 * 60),
        requireVerification,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        manyAmounts,
        data,
        invoiceType,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      // Now try to add 3 more milestones (48 + 3 = 51 > 50 limit)
      await expect(
        tempInvoice.write.addMilestones([[1n, 1n, 1n]], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(tempInvoice, 'ExceedsMilestoneLimit');
    });

    it('Should handle milestone limit exactly at MAX_MILESTONE_LIMIT', async function () {
      // Create invoice with 49 milestones
      const manyAmounts = Array(49).fill(BigInt(1));
      const currentTime = await currentTimestamp();
      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(currentTime + 30 * 24 * 60 * 60),
        requireVerification,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        manyAmounts,
        data,
        invoiceType,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      // Add 1 more milestone to reach exactly 50 (should succeed)
      await tempInvoice.write.addMilestones([[1n]], {
        account: client.account,
      });

      expect((await tempInvoice.read.getAmounts()).length).to.equal(50);

      // Try to add one more (should fail as it exceeds limit)
      await expect(
        tempInvoice.write.addMilestones([[1n]], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(tempInvoice, 'ExceedsMilestoneLimit');
    });

    it('Should revert init with no milestones', async function () {
      await expect(
        createEscrow(
          factory,
          invoice,
          invoiceType,
          getAddress(client.account.address),
          getAddress(provider.account.address),
          individualResolverType,
          getAddress(resolver.account.address),
          mockToken,
          [], // Empty amounts array
          terminationTime,
          zeroHash,
          requireVerification,
        ),
      ).to.be.revertedWithCustomError(invoice, 'NoMilestones');
    });

    it('Should revert init with milestones exceeding limit', async function () {
      const tooManyAmounts = Array(51).fill(BigInt(1)); // 51 > 50 limit

      await expect(
        createEscrow(
          factory,
          invoice,
          invoiceType,
          getAddress(client.account.address),
          getAddress(provider.account.address),
          individualResolverType,
          getAddress(resolver.account.address),
          mockToken,
          tooManyAmounts,
          terminationTime,
          zeroHash,
          requireVerification,
        ),
      ).to.be.revertedWithCustomError(invoice, 'ExceedsMilestoneLimit');
    });
  });

  describe('Address Update Functionality', function () {
    let updatableInvoice: ContractTypesMap['SmartInvoiceEscrow'];

    beforeEach(async function () {
      // Create invoice with receiver addresses using InitData struct
      const data = encodeAbiParameters(
        [
          {
            type: 'tuple',
            name: 'initData',
            components: [
              { name: 'client', type: 'address' },
              { name: 'resolverType', type: 'uint8' },
              { name: 'resolver', type: 'address' },
              { name: 'token', type: 'address' },
              { name: 'terminationTime', type: 'uint256' },
              { name: 'requireVerification', type: 'bool' },
              { name: 'providerReceiver', type: 'address' },
              { name: 'clientReceiver', type: 'address' },
              { name: 'feeBPS', type: 'uint256' },
              { name: 'treasury', type: 'address' },
              { name: 'details', type: 'string' },
            ],
          },
        ],
        [
          {
            client: getAddress(client.account.address),
            resolverType: individualResolverType,
            resolver: getAddress(resolver.account.address),
            token: mockToken,
            terminationTime: BigInt(terminationTime),
            requireVerification,
            providerReceiver: getAddress(providerReceiver.account.address),
            clientReceiver: getAddress(clientReceiver.account.address),
            feeBPS: 0n, // no fees for this test
            treasury: zeroAddress, // no treasury needed when feeBPS is 0
            details: '',
          },
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
      updatableInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );
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
      const receipt = await updatableInvoice.write.updateClient(
        [client2.account.address],
        {
          account: client.account,
        },
      );
      expect(await updatableInvoice.read.client()).to.equal(
        getAddress(client2.account.address),
      );
      await expect(receipt)
        .to.emit(updatableInvoice, 'UpdatedClient')
        .withArgs(getAddress(client2.account.address));
    });

    it('Should revert the client update if not the client', async function () {
      await expect(
        updatableInvoice.write.updateClient([client2.account.address], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(updatableInvoice, 'NotClient');
    });

    it('Should revert client update with zero address', async function () {
      await expect(
        updatableInvoice.write.updateClient([zeroAddress], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(updatableInvoice, 'InvalidClient');
    });

    it('Should allow the provider to update their address', async function () {
      const receipt = await updatableInvoice.write.updateProvider(
        [provider2.account.address],
        {
          account: provider.account,
        },
      );
      expect(await updatableInvoice.read.provider()).to.equal(
        getAddress(provider2.account.address),
      );
      await expect(receipt)
        .to.emit(updatableInvoice, 'UpdatedProvider')
        .withArgs(getAddress(provider2.account.address));
    });

    it('Should revert provider update if not the provider', async function () {
      await expect(
        updatableInvoice.write.updateProvider([provider2.account.address], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(updatableInvoice, 'NotProvider');
    });

    it('Should revert provider update with zero address', async function () {
      await expect(
        updatableInvoice.write.updateProvider([zeroAddress], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(updatableInvoice, 'InvalidProvider');
    });

    it('Should allow the provider to update their receiving address', async function () {
      const receipt = await updatableInvoice.write.updateProviderReceiver(
        [providerReceiver2.account.address],
        { account: provider.account },
      );
      expect(await updatableInvoice.read.providerReceiver()).to.equal(
        getAddress(providerReceiver2.account.address),
      );
      await expect(receipt)
        .to.emit(updatableInvoice, 'UpdatedProviderReceiver')
        .withArgs(getAddress(providerReceiver2.account.address));
    });

    it('Should revert provider receiver update if not the provider', async function () {
      await expect(
        updatableInvoice.write.updateProviderReceiver(
          [providerReceiver2.account.address],
          { account: client.account },
        ),
      ).to.be.revertedWithCustomError(updatableInvoice, 'NotProvider');
    });

    it('Should revert provider receiver update with zero address', async function () {
      await expect(
        updatableInvoice.write.updateProviderReceiver([zeroAddress], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(
        updatableInvoice,
        'InvalidProviderReceiver',
      );
    });

    it('Should revert provider receiver update with contract address', async function () {
      await expect(
        updatableInvoice.write.updateProviderReceiver(
          [updatableInvoice.address],
          { account: provider.account },
        ),
      ).to.be.revertedWithCustomError(
        updatableInvoice,
        'InvalidProviderReceiver',
      );
    });

    it('Should allow the client to update their receiving address', async function () {
      const receipt = await updatableInvoice.write.updateClientReceiver(
        [clientReceiver2.account.address],
        {
          account: client.account,
        },
      );
      expect(await updatableInvoice.read.clientReceiver()).to.equal(
        getAddress(clientReceiver2.account.address),
      );
      await expect(receipt)
        .to.emit(updatableInvoice, 'UpdatedClientReceiver')
        .withArgs(getAddress(clientReceiver2.account.address));
    });

    it('Should revert client receiver update if not the client', async function () {
      await expect(
        updatableInvoice.write.updateClientReceiver(
          [clientReceiver2.account.address],
          { account: provider.account },
        ),
      ).to.be.revertedWithCustomError(updatableInvoice, 'NotClient');
    });

    it('Should revert client receiver update with zero address', async function () {
      await expect(
        updatableInvoice.write.updateClientReceiver([zeroAddress], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(
        updatableInvoice,
        'InvalidClientReceiver',
      );
    });

    it('Should revert client receiver update with contract address', async function () {
      await expect(
        updatableInvoice.write.updateClientReceiver(
          [updatableInvoice.address],
          { account: client.account },
        ),
      ).to.be.revertedWithCustomError(
        updatableInvoice,
        'InvalidClientReceiver',
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
          {
            type: 'tuple',
            name: 'initData',
            components: [
              { name: 'client', type: 'address' },
              { name: 'resolverType', type: 'uint8' },
              { name: 'resolver', type: 'address' },
              { name: 'token', type: 'address' },
              { name: 'terminationTime', type: 'uint256' },
              { name: 'requireVerification', type: 'bool' },
              { name: 'providerReceiver', type: 'address' },
              { name: 'clientReceiver', type: 'address' },
              { name: 'feeBPS', type: 'uint256' },
              { name: 'treasury', type: 'address' },
              { name: 'details', type: 'string' },
            ],
          },
        ],
        [
          {
            client: getAddress(client.account.address),
            resolverType: individualResolverType,
            resolver: getAddress(resolver.account.address),
            token: mockToken,
            terminationTime: BigInt(currentTime + 1000),
            requireVerification: false,
            providerReceiver: getAddress(providerReceiver.account.address),
            clientReceiver: getAddress(clientReceiver.account.address),
            feeBPS: 0n,
            treasury: zeroAddress,
            details: '',
          },
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
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

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
          {
            type: 'tuple',
            name: 'initData',
            components: [
              { name: 'client', type: 'address' },
              { name: 'resolverType', type: 'uint8' },
              { name: 'resolver', type: 'address' },
              { name: 'token', type: 'address' },
              { name: 'terminationTime', type: 'uint256' },
              { name: 'requireVerification', type: 'bool' },
              { name: 'providerReceiver', type: 'address' },
              { name: 'clientReceiver', type: 'address' },
              { name: 'feeBPS', type: 'uint256' },
              { name: 'treasury', type: 'address' },
              { name: 'details', type: 'string' },
            ],
          },
        ],
        [
          {
            client: getAddress(client.account.address),
            resolverType: individualResolverType,
            resolver: getAddress(resolver.account.address),
            token: mockToken,
            terminationTime: BigInt(currentTime + 1000),
            requireVerification: false,
            providerReceiver: getAddress(providerReceiver.account.address),
            clientReceiver: getAddress(clientReceiver.account.address),
            feeBPS: 0n,
            treasury: zeroAddress,
            details: '',
          },
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
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

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

  describe('Additional Error Handling and Edge Cases', function () {
    it('Should revert init when called directly', async function () {
      const newInvoice = await viem.deployContract('SmartInvoiceEscrow', [
        mockWrappedETH,
        factory.address,
      ]);

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });

      // Try to call init directly (not from factory)
      await expect(
        newInvoice.write.init([
          getAddress(provider.account.address),
          amounts,
          data,
        ]),
      ).to.be.revertedWithCustomError(newInvoice, 'InvalidInitialization');
    });

    it('Should revert with invalid resolution rate bounds', async function () {
      // Mock a factory that returns invalid resolution rate
      const mockFactory = await viem.deployContract('MockFactory');
      const testInvoice = await viem.deployContract('SmartInvoiceEscrow', [
        mockWrappedETH,
        mockFactory.address,
      ]);

      // Set up mock factory to return resolution rate > 1000
      await mockFactory.write.setResolutionRateBPS([
        resolver.account.address,
        1001n,
      ]);

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });

      await expect(
        mockFactory.write.callInit([
          testInvoice.address,
          getAddress(provider.account.address),
          amounts,
          data,
        ]),
      ).to.be.revertedWithCustomError(testInvoice, 'InvalidResolutionRate');
    });

    it('Should revert resolve with incorrect resolution awards', async function () {
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
        mockWrappedETH,
      );

      await setBalanceOf(mockToken, lockedInvoice.address, 100);

      // Try resolution where awards don't match balance - fee
      await expect(
        lockedInvoice.write.resolve([50n, 40n, zeroHash], {
          account: resolver.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'ResolutionMismatch');
      // 50 + 40 = 90, but should be 100 - 5 = 95

      // Correct resolution should work
      await lockedInvoice.write.resolve([45n, 50n, zeroHash], {
        account: resolver.account,
      });
      // 45 + 50 = 95 = 100 - 5 ✓
    });

    it('Should revert resolve if not individual resolver', async function () {
      const lockedInvoice = await getLockedEscrow(
        factory,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        arbitratorResolverType, // Arbitrator resolver, not individual
        mockArbitrator,
        mockToken,
        amounts,
        zeroHash,
        mockWrappedETH,
        10n,
      );

      await setBalanceOf(mockToken, lockedInvoice.address, 100);

      await expect(
        lockedInvoice.write.resolve([45n, 50n, zeroHash], {
          account: resolver.account,
        }),
      ).to.be.revertedWithCustomError(
        lockedInvoice,
        'InvalidIndividualResolver',
      );
    });

    it('Should revert resolve if not locked', async function () {
      await expect(
        invoice.write.resolve([45n, 50n, zeroHash], {
          account: resolver.account,
        }),
      ).to.be.revertedWithCustomError(invoice, 'NotLocked');
    });

    it('Should revert resolve from non-resolver', async function () {
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
        mockWrappedETH,
      );

      await setBalanceOf(mockToken, lockedInvoice.address, 100);

      await expect(
        lockedInvoice.write.resolve([45n, 50n, zeroHash], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'NotResolver');
    });

    it('Should revert resolve with zero balance', async function () {
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
        mockWrappedETH,
      );

      // Set balance first so ResolutionMismatch check passes, then verify BalanceIsZero check
      await setBalanceOf(mockToken, lockedInvoice.address, 20n);
      // Clear balance after setting to trigger BalanceIsZero
      await setBalanceOf(mockToken, lockedInvoice.address, 0n);

      await expect(
        lockedInvoice.write.resolve([0n, 0n, zeroHash], {
          account: resolver.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'BalanceIsZero');
    });

    it('Should revert lock by non-party', async function () {
      await setBalanceOf(mockToken, invoice.address, 10);

      await expect(
        invoice.write.lock([zeroHash], {
          account: randomSigner.account,
        }),
      ).to.be.revertedWithCustomError(invoice, 'NotParty');
    });

    it('Should revert lock after termination', async function () {
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
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await setBalanceOf(mockToken, tempInvoice.address, 10);
      await testClient.increaseTime({ seconds: 1000 });

      await expect(
        tempInvoice.write.lock([zeroHash], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(tempInvoice, 'Terminated');
    });

    it('Should revert lock if already locked', async function () {
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
        mockWrappedETH,
      );

      await expect(
        lockedInvoice.write.lock([zeroHash], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'Locked');
    });

    it('Should handle arbitrator lock with correct dispute creation', async function () {
      const currentTime = await currentTimestamp();
      const tx = await createEscrow(
        factory,
        invoice,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        arbitratorResolverType,
        mockArbitrator,
        mockToken,
        amounts,
        currentTime + 3600,
        zeroHash,
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      await setBalanceOf(mockToken, tempInvoice.address, 10);

      const receipt = await tempInvoice.write.lock(['dispute-uri'], {
        account: client.account,
        value: 10n, // Arbitration cost
      });

      await expect(receipt)
        .to.emit(tempInvoice, 'Dispute')
        .withArgs(mockArbitrator, 1, 0, 1); // arbitrator, disputeId, metaEvidenceId, evidenceGroupId

      await expect(receipt)
        .to.emit(tempInvoice, 'Lock')
        .withArgs(getAddress(client.account.address), 'dispute-uri');

      expect(await tempInvoice.read.locked()).to.equal(true);
      expect(await tempInvoice.read.disputeId()).to.equal(1);
      expect(await tempInvoice.read.evidenceGroupId()).to.equal(1);
    });

    it('Should handle getAmounts correctly', async function () {
      const currentAmounts = await invoice.read.getAmounts();
      expect(currentAmounts.length).to.equal(2);
      expect(currentAmounts[0]).to.equal(10n);
      expect(currentAmounts[1]).to.equal(10n);

      // Add milestones and check again
      await invoice.write.addMilestones([[15n, 20n]]);
      const newAmounts = await invoice.read.getAmounts();
      expect(newAmounts.length).to.equal(4);
      expect(newAmounts[2]).to.equal(15n);
      expect(newAmounts[3]).to.equal(20n);
    });

    it('Should properly emit events during initialization', async function () {
      const currentTime = await currentTimestamp();
      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(currentTime + 3600),
        requireVerification: false, // Auto-verify
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: 'Test invoice details',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Should emit Verified event during init (requireVerification = false)
      const logs = await publicClient.getLogs({
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      // Should find InvoiceInit, MetaEvidence, and Verified events
      expect(logs.length).to.be.greaterThan(2);
    });

    it('Should emit all events with correct parameters in resolve function', async function () {
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
        mockWrappedETH,
      );

      await setBalanceOf(mockToken, lockedInvoice.address, 100);
      const resolutionURI = 'ipfs://resolution-details';

      // Balance = 100, resolutionRateBPS = 500, so fee = (100 * 500) / 10000 = 5
      // Client gets 30, provider gets 65, resolver gets 5
      const receipt = await lockedInvoice.write.resolve(
        [30n, 65n, resolutionURI],
        {
          account: resolver.account,
        },
      );

      await expect(receipt).to.emit(lockedInvoice, 'Resolve').withArgs(
        getAddress(resolver.account.address),
        30, // clientAward
        65, // providerAward
        5, // resolutionFee
        resolutionURI,
      );
    });

    it('Should properly handle multiple evidence submissions with correct evidenceGroupId', async function () {
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
        mockWrappedETH,
        10n,
      );

      const evidenceGroupId = await lockedInvoice.read.evidenceGroupId();
      expect(evidenceGroupId).to.equal(1);

      // Submit evidence by client
      const clientEvidence = 'ipfs://client-evidence';
      const clientReceipt = await lockedInvoice.write.submitEvidence(
        [clientEvidence],
        {
          account: client.account,
        },
      );

      await expect(clientReceipt)
        .to.emit(lockedInvoice, 'Evidence')
        .withArgs(
          mockArbitrator,
          evidenceGroupId,
          getAddress(client.account.address),
          clientEvidence,
        );

      // Submit evidence by provider - should use same evidenceGroupId
      const providerEvidence = 'ipfs://provider-evidence';
      const providerReceipt = await lockedInvoice.write.submitEvidence(
        [providerEvidence],
        {
          account: provider.account,
        },
      );

      await expect(providerReceipt).to.emit(lockedInvoice, 'Evidence').withArgs(
        mockArbitrator,
        evidenceGroupId, // Same group ID for same dispute
        getAddress(provider.account.address),
        providerEvidence,
      );
    });

    it('Should validate Deposit event parameters correctly', async function () {
      const tx = await createEscrow(
        factory,
        invoice,
        invoiceType,
        getAddress(client.account.address),
        getAddress(provider.account.address),
        individualResolverType,
        getAddress(resolver.account.address),
        mockWrappedETH, // Use wrapped ETH as main token
        amounts,
        terminationTime,
        zeroHash,
        requireVerification,
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        tempAddress!,
      );

      const depositAmount = 25n;
      const receipt = await client.sendTransaction({
        to: tempInvoice.address,
        value: depositAmount,
      });

      await expect(receipt).to.emit(tempInvoice, 'Deposit').withArgs(
        getAddress(client.account.address), // sender
        depositAmount, // amount
        getAddress(mockWrappedETH), // token
      );
    });
  });

  describe('Fee System', function () {
    it('Should set fee parameters during initialization', async function () {
      const feeBPS = 500n; // 5%
      const treasury = randomSigner.account.address;

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: providerReceiver.account.address,
        clientReceiver: clientReceiver.account.address,
        feeBPS,
        treasury,
        details: '',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      expect(await tempInvoice.read.feeBPS()).to.equal(feeBPS);
      expect(await tempInvoice.read.treasury()).to.equal(getAddress(treasury));
    });

    it('Should revert initialization with invalid feeBPS', async function () {
      const invalidFeeBPS = 1001n; // > 1000 (10%)
      const treasury = randomSigner.account.address;

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: providerReceiver.account.address,
        clientReceiver: clientReceiver.account.address,
        feeBPS: invalidFeeBPS,
        treasury,
        details: '',
      });

      const hash = factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);

      await expect(hash).to.be.revertedWithCustomError(
        invoice,
        'InvalidFeeBPS',
      );
    });

    it('Should revert initialization with invalid treasury when feeBPS > 0', async function () {
      const feeBPS = 500n; // 5%
      const invalidTreasury = zeroAddress;

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: providerReceiver.account.address,
        clientReceiver: clientReceiver.account.address,
        feeBPS,
        treasury: invalidTreasury,
        details: '',
      });

      const hash = factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);

      await expect(hash).to.be.revertedWithCustomError(
        invoice,
        'InvalidTreasury',
      );
    });

    it('Should deduct fees on provider payment', async function () {
      const feeBPS = 1000n; // 10%
      const treasury = randomSigner.account.address;

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: providerReceiver.account.address,
        clientReceiver: clientReceiver.account.address,
        feeBPS,
        treasury,
        details: '',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      await setBalanceOf(mockToken, tempInvoice.address, total);

      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        providerReceiver.account.address,
      );
      const beforeTreasuryBalance = await getBalanceOf(mockToken, treasury);

      const releaseHash = await tempInvoice.write.release([0n], {
        account: client.account,
      });

      const milestoneAmount = amounts[0];
      const expectedFee = (milestoneAmount * feeBPS) / 10000n;
      const expectedProviderAmount = milestoneAmount - expectedFee;

      const afterProviderBalance = await getBalanceOf(
        mockToken,
        providerReceiver.account.address,
      );
      const afterTreasuryBalance = await getBalanceOf(mockToken, treasury);

      expect(afterProviderBalance).to.equal(
        beforeProviderBalance + expectedProviderAmount,
      );
      expect(afterTreasuryBalance).to.equal(
        beforeTreasuryBalance + expectedFee,
      );

      // Check for FeeTransferred event
      await expect(releaseHash)
        .to.emit(tempInvoice, 'FeeTransferred')
        .withArgs(mockToken, expectedFee, getAddress(treasury));
    });

    it('Should deduct fees on client withdrawal', async function () {
      const feeBPS = 500n; // 5%
      const treasury = randomSigner.account.address;

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: providerReceiver.account.address,
        clientReceiver: clientReceiver.account.address,
        feeBPS,
        treasury,
        details: '',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      await setBalanceOf(mockToken, tempInvoice.address, total);
      await testClient.increaseTime({ seconds: terminationTime + 1000 });

      const beforeClientBalance = await getBalanceOf(
        mockToken,
        clientReceiver.account.address,
      );
      const beforeTreasuryBalance = await getBalanceOf(mockToken, treasury);

      const withdrawHash = await tempInvoice.write.withdraw({
        account: client.account,
      });

      const expectedFee = (total * feeBPS) / 10000n;
      const expectedClientAmount = total - expectedFee;

      const afterClientBalance = await getBalanceOf(
        mockToken,
        clientReceiver.account.address,
      );
      const afterTreasuryBalance = await getBalanceOf(mockToken, treasury);

      expect(afterClientBalance).to.equal(
        beforeClientBalance + expectedClientAmount,
      );
      expect(afterTreasuryBalance).to.equal(
        beforeTreasuryBalance + expectedFee,
      );

      // Check for FeeTransferred event
      await expect(withdrawHash)
        .to.emit(tempInvoice, 'FeeTransferred')
        .withArgs(mockToken, expectedFee, getAddress(treasury));
    });

    it('Should handle different fee percentages correctly', async function () {
      // Test 1.5% fee
      const feeBPS = 150n; // 1.5%
      const treasury = randomSigner.account.address;
      const futureTerminationTime =
        (await currentTimestamp()) + 30 * 24 * 60 * 60;

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(futureTerminationTime),
        requireVerification,
        providerReceiver: providerReceiver.account.address,
        clientReceiver: clientReceiver.account.address,
        feeBPS,
        treasury,
        details: '',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      await setBalanceOf(mockToken, tempInvoice.address, total);

      const beforeTreasuryBalance = await getBalanceOf(mockToken, treasury);

      await tempInvoice.write.release([0n], {
        account: client.account,
      });

      const milestoneAmount = amounts[0];
      const expectedFee = (milestoneAmount * feeBPS) / 10000n;

      const afterTreasuryBalance = await getBalanceOf(mockToken, treasury);

      expect(afterTreasuryBalance).to.equal(
        beforeTreasuryBalance + expectedFee,
      );
    });

    it('Should work with custom receiver addresses and fees', async function () {
      const feeBPS = 750n; // 7.5%
      const treasury = randomSigner.account.address;
      const futureTerminationTime =
        (await currentTimestamp()) + 30 * 24 * 60 * 60;

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(futureTerminationTime),
        requireVerification,
        providerReceiver: providerReceiver2.account.address, // Different receiver
        clientReceiver: clientReceiver2.account.address, // Different receiver
        feeBPS,
        treasury,
        details: '',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      await setBalanceOf(mockToken, tempInvoice.address, total);

      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        providerReceiver2.account.address,
      );
      const beforeTreasuryBalance = await getBalanceOf(mockToken, treasury);

      await tempInvoice.write.release([0n], {
        account: client.account,
      });

      const milestoneAmount = amounts[0];
      const expectedFee = (milestoneAmount * feeBPS) / 10000n;
      const expectedProviderAmount = milestoneAmount - expectedFee;

      const afterProviderBalance = await getBalanceOf(
        mockToken,
        providerReceiver2.account.address,
      );
      const afterTreasuryBalance = await getBalanceOf(mockToken, treasury);

      expect(afterProviderBalance).to.equal(
        beforeProviderBalance + expectedProviderAmount,
      );
      expect(afterTreasuryBalance).to.equal(
        beforeTreasuryBalance + expectedFee,
      );
    });

    it('Should not charge fees when feeBPS is 0', async function () {
      const feeBPS = 0n;
      const treasury = zeroAddress; // Can be zero address when feeBPS is 0
      const futureTerminationTime =
        (await currentTimestamp()) + 30 * 24 * 60 * 60;

      const data = encodeInitData({
        client: client.account.address,
        resolverType: individualResolverType,
        resolver: resolver.account.address,
        token: mockToken,
        terminationTime: BigInt(futureTerminationTime),
        requireVerification,
        providerReceiver: providerReceiver.account.address,
        clientReceiver: clientReceiver.account.address,
        feeBPS,
        treasury,
        details: '',
      });

      const hash = await factory.write.create([
        getAddress(provider.account.address),
        amounts,
        data,
        invoiceType,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await viem.getContractAt(
        'SmartInvoiceEscrow',
        address!,
      );

      await setBalanceOf(mockToken, tempInvoice.address, total);

      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        providerReceiver.account.address,
      );

      const releaseHash = await tempInvoice.write.release([0n], {
        account: client.account,
      });

      const afterProviderBalance = await getBalanceOf(
        mockToken,
        providerReceiver.account.address,
      );

      // Should receive full milestone amount without fees
      expect(afterProviderBalance).to.equal(beforeProviderBalance + amounts[0]);

      // Should not emit FeeTransferred event when no fees
      await expect(releaseHash).not.to.emit(tempInvoice, 'FeeTransferred');
    });
  });
});

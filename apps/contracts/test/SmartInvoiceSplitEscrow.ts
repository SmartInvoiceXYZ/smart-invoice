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
  Hex,
  toBytes,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem';

import {
  awaitInvoiceAddress,
  getBalanceOf,
  getLockedSplitEscrow,
  setBalanceOf,
} from './utils';

const individualResolverType = 0;
const arbitratorResolverType = 1;
const amounts = [BigInt(10), BigInt(10)];
const terminationTime =
  Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60;
const requireVerification = true;
const invoiceType = toHex(toBytes('split-escrow', { size: 32 }));
const daoFee = 1000n; // 10%

/**
 * SmartInvoiceSplitEscrow Tests
 *
 * This test suite focuses only on the DAO fee functionality that differs from SmartInvoiceEscrow.
 * All other functionality (basic operations, arbitration, milestones, etc.) is already tested
 * in SmartInvoiceEscrow.ts and inherited by this contract.
 */
describe('SmartInvoiceSplitEscrow - DAO Fee Functionality', function () {
  let factory: ContractTypesMap['SmartInvoiceFactory'];
  let invoice: ContractTypesMap['SmartInvoiceSplitEscrow'];
  let mockToken: Hex;
  let mockWrappedNativeToken: Hex;
  let mockArbitrator: Hex;
  let mockArbitratorContract: ContractTypesMap['MockArbitrator'];
  let client: WalletClient;
  let provider: WalletClient;
  let resolver: WalletClient;
  let dao: WalletClient;
  let publicClient: PublicClient;

  beforeEach(async function () {
    const walletClients = await viem.getWalletClients();
    [client, provider, resolver, dao] = walletClients;
    publicClient = await viem.getPublicClient();

    const mockTokenContract = await viem.deployContract('MockToken');
    mockToken = getAddress(mockTokenContract.address);

    const mockWrappedNativeTokenContract =
      await viem.deployContract('MockWETH');
    mockWrappedNativeToken = getAddress(mockWrappedNativeTokenContract.address);

    mockArbitratorContract = await viem.deployContract('MockArbitrator', [10n]);
    mockArbitrator = getAddress(mockArbitratorContract.address);

    factory = await viem.deployContract('SmartInvoiceFactory', [
      mockWrappedNativeToken,
    ]);
    const invoiceImpl = await viem.deployContract('SmartInvoiceSplitEscrow');

    await factory.write.addImplementation([invoiceType, invoiceImpl.address]);

    // Create invoice with DAO fee
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
        'address',
        'uint256',
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
        getAddress(dao.account.address),
        daoFee,
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
    invoice = await viem.getContractAt('SmartInvoiceSplitEscrow', address!);
  });

  describe('DAO Fee Initialization', function () {
    it('Should deploy with correct DAO and fee settings', async function () {
      expect(await invoice.read.dao()).to.equal(
        getAddress(dao.account.address),
      );
      expect(await invoice.read.daoFee()).to.equal(daoFee);
    });

    it('Should revert if daoFee > 0 but dao address is zero', async function () {
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
          'address',
          'uint256',
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
          zeroAddress,
          zeroAddress,
          zeroAddress, // Invalid DAO address
          1000n, // Non-zero fee
        ],
      );

      await expect(
        factory.write.create([
          getAddress(provider.account.address),
          amounts,
          data,
          invoiceType,
        ]),
      ).to.be.revertedWithCustomError(invoice, 'InvalidDAO');
    });

    it('Should allow zero daoFee with zero dao address', async function () {
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
          'address',
          'uint256',
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
          zeroAddress,
          zeroAddress,
          zeroAddress, // Zero DAO address
          0n, // Zero fee
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
      const testInvoice = await viem.getContractAt(
        'SmartInvoiceSplitEscrow',
        address!,
      );

      expect(await testInvoice.read.dao()).to.equal(zeroAddress);
      expect(await testInvoice.read.daoFee()).to.equal(0n);
    });
  });

  describe('DAO Fee Splitting on Releases', function () {
    it('Should split payment between provider and DAO on release', async function () {
      await setBalanceOf(mockToken, invoice.address, 100n);

      const beforeDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      await invoice.write.release({ account: client.account });

      const afterDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const afterProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      // DAO should receive 10% of 10 tokens = 1 token
      expect(afterDaoBalance).to.equal(beforeDaoBalance + 1n);
      // Provider should receive 90% of 10 tokens = 9 tokens
      expect(afterProviderBalance).to.equal(beforeProviderBalance + 9n);
    });

    it('Should handle zero DAO fee correctly', async function () {
      // Create invoice with zero DAO fee
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
          'address',
          'uint256',
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
          zeroAddress,
          zeroAddress,
          zeroAddress, // Zero DAO address
          0n, // Zero fee
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
      const zeroFeeInvoice = await viem.getContractAt(
        'SmartInvoiceSplitEscrow',
        address!,
      );

      await setBalanceOf(mockToken, zeroFeeInvoice.address, 100n);

      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      await zeroFeeInvoice.write.release({ account: client.account });

      const afterProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      // Provider should receive full amount since DAO fee is 0
      expect(afterProviderBalance).to.equal(beforeProviderBalance + 10n);
    });

    it('Should handle different DAO fee percentages', async function () {
      // Test with 25% DAO fee (2500 basis points)
      const highDaoFee = 2500n;
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
          'address',
          'uint256',
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
          zeroAddress,
          zeroAddress,
          getAddress(dao.account.address),
          highDaoFee,
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
      const highFeeInvoice = await viem.getContractAt(
        'SmartInvoiceSplitEscrow',
        address!,
      );

      await setBalanceOf(mockToken, highFeeInvoice.address, 100n);

      const beforeDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      await highFeeInvoice.write.release({ account: client.account });

      const afterDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const afterProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      // DAO should receive 25% of 10 tokens = 2.5 tokens (rounded down to 2)
      expect(afterDaoBalance).to.equal(beforeDaoBalance + 2n);
      // Provider should receive 75% of 10 tokens = 7.5 tokens (rounded up to 8)
      expect(afterProviderBalance).to.equal(beforeProviderBalance + 8n);
    });
  });

  describe('DAO Fee Splitting on Dispute Resolution', function () {
    it('Should split provider award between provider and DAO on individual resolution', async function () {
      const lockedInvoice = await getLockedSplitEscrow(
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
        zeroAddress,
        zeroAddress,
        getAddress(dao.account.address),
        daoFee,
      );

      await setBalanceOf(mockToken, lockedInvoice.address, 100n);

      const beforeDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );
      const beforeResolverBalance = await getBalanceOf(
        mockToken,
        resolver.account.address,
      );
      const beforeClientBalance = await getBalanceOf(
        mockToken,
        client.account.address,
      );

      // Resolve: 10 to client, 85 to provider, 5 resolution fee
      await lockedInvoice.write.resolve([10n, 85n, zeroHash], {
        account: resolver.account,
      });

      const afterDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const afterProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );
      const afterResolverBalance = await getBalanceOf(
        mockToken,
        resolver.account.address,
      );
      const afterClientBalance = await getBalanceOf(
        mockToken,
        client.account.address,
      );

      // Client gets full 10 tokens (no DAO fee on client awards)
      expect(afterClientBalance).to.equal(beforeClientBalance + 10n);
      // Resolver gets full 5 token resolution fee
      expect(afterResolverBalance).to.equal(beforeResolverBalance + 5n);
      // DAO gets 10% of provider award: 85 * 0.1 = 8.5 (rounded down to 8)
      expect(afterDaoBalance).to.equal(beforeDaoBalance + 8n);
      // Provider gets remainder: 85 - 8 = 77
      expect(afterProviderBalance).to.equal(beforeProviderBalance + 77n);
    });

    it('Should split provider award between provider and DAO on arbitrator ruling', async function () {
      const lockedInvoice = await getLockedSplitEscrow(
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
        zeroAddress,
        zeroAddress,
        getAddress(dao.account.address),
        daoFee,
        10n,
      );

      await setBalanceOf(mockToken, lockedInvoice.address, 100n);

      const beforeDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );
      const beforeClientBalance = await getBalanceOf(
        mockToken,
        client.account.address,
      );

      // Rule in favor of provider (ruling 5 = 0% to client, 100% to provider)
      await mockArbitratorContract.write.executeRuling([
        lockedInvoice.address,
        5n,
      ]);

      const afterDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const afterProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );
      const afterClientBalance = await getBalanceOf(
        mockToken,
        client.account.address,
      );

      // Client gets 0 tokens
      expect(afterClientBalance).to.equal(beforeClientBalance);
      // DAO gets 10% of 100 tokens = 10 tokens
      expect(afterDaoBalance).to.equal(beforeDaoBalance + 10n);
      // Provider gets 90% of 100 tokens = 90 tokens
      expect(afterProviderBalance).to.equal(beforeProviderBalance + 90n);
    });
  });

  describe('Edge Cases and Validation', function () {
    it('Should handle rounding correctly for small amounts', async function () {
      await setBalanceOf(mockToken, invoice.address, 20n);
      await invoice.write.release({ account: client.account }); // release first two milestones
      await invoice.write.release({ account: client.account });
      await setBalanceOf(mockToken, invoice.address, 1n); // Very small amount

      const beforeDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      await invoice.write.release({ account: client.account });

      const afterDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const afterProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      // With 10% fee on 1 token: DAO gets 0 (rounded down), provider gets 1
      expect(afterDaoBalance).to.equal(beforeDaoBalance);
      expect(afterProviderBalance).to.equal(beforeProviderBalance + 1n);
    });

    it('Should handle maximum fee percentage (100%)', async function () {
      // Create invoice with 100% DAO fee (10000 basis points)
      const maxDaoFee = 10000n;
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
          'address',
          'uint256',
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
          zeroAddress,
          zeroAddress,
          getAddress(dao.account.address),
          maxDaoFee,
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
      const maxFeeInvoice = await viem.getContractAt(
        'SmartInvoiceSplitEscrow',
        address!,
      );

      await setBalanceOf(mockToken, maxFeeInvoice.address, 100n);

      const beforeDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const beforeProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      await maxFeeInvoice.write.release({ account: client.account });

      const afterDaoBalance = await getBalanceOf(
        mockToken,
        dao.account.address,
      );
      const afterProviderBalance = await getBalanceOf(
        mockToken,
        provider.account.address,
      );

      // DAO should receive 100% of 10 tokens = 10 tokens
      expect(afterDaoBalance).to.equal(beforeDaoBalance + 10n);
      // Provider should receive 0% of 10 tokens = 0 tokens
      expect(afterProviderBalance).to.equal(beforeProviderBalance);
    });
  });
});

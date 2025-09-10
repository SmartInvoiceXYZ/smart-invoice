import { expect } from 'chai';
import { getAddress, zeroAddress } from 'viem';

import {
  awaitInvoiceAddress,
  currentTimestamp,
  deployEscrow,
  getBalanceOf,
  getEscrowAt,
  getSplitsBalanceOf,
  setBalanceOf,
  SuiteCtx,
  VariantName,
} from '../helpers';

// eslint-disable-next-line mocha/no-exports
export function feeSystemTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Fee System', function () {
    it('Should set fee parameters during initialization', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
        randomSigner,
      } = ctx();

      const feeBPS = 500n; // 5%
      const treasury = randomSigner.account.address;

      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(
            (await currentTimestamp()) + 30 * 24 * 60 * 60,
          ),
          requireVerification: true,
          providerReceiver: providerReceiver.account.address,
          clientReceiver: clientReceiver.account.address,
          feeBPS,
          treasury,
          details: '',
        },
      );
      const address = await awaitInvoiceAddress(tx);
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      expect(await tempInvoice.read.feeBPS()).to.equal(feeBPS);
      expect(await tempInvoice.read.treasury()).to.equal(getAddress(treasury));
    });

    it('Should revert initialization with invalid feeBPS', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
        randomSigner,
        escrowImplementation,
      } = ctx();

      const invalidFeeBPS = 1001n; // > 1000 (10%)
      const treasury = randomSigner.account.address;

      await expect(
        deployEscrow(
          variant,
          factory,
          getAddress(provider.account.address),
          amounts,
          {
            client: client.account.address,
            resolverData,
            token: mockToken.address,
            terminationTime: BigInt(
              (await currentTimestamp()) + 30 * 24 * 60 * 60,
            ),
            requireVerification: true,
            providerReceiver: providerReceiver.account.address,
            clientReceiver: clientReceiver.account.address,
            feeBPS: invalidFeeBPS,
            treasury,
            details: '',
          },
        ),
      ).to.be.revertedWithCustomError(escrowImplementation, 'InvalidFeeBPS');
    });

    it('Should revert initialization with invalid treasury when feeBPS > 0', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
        escrowImplementation,
      } = ctx();

      const feeBPS = 500n; // 5%
      const invalidTreasury = zeroAddress;

      await expect(
        deployEscrow(
          variant,
          factory,
          getAddress(provider.account.address),
          amounts,
          {
            client: client.account.address,
            resolverData,
            token: mockToken.address,
            terminationTime: BigInt(
              (await currentTimestamp()) + 30 * 24 * 60 * 60,
            ),
            requireVerification: true,
            providerReceiver: providerReceiver.account.address,
            clientReceiver: clientReceiver.account.address,
            feeBPS,
            treasury: invalidTreasury,
            details: '',
          },
        ),
      ).to.be.revertedWithCustomError(escrowImplementation, 'InvalidTreasury');
    });

    it('Should deduct fees on provider payment', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
        randomSigner,
        total,
        mockSplitsWarehouse,
      } = ctx();

      const feeBPS = 1000n; // 10%
      const treasury = randomSigner.account.address;

      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(
            (await currentTimestamp()) + 30 * 24 * 60 * 60,
          ),
          requireVerification: true,
          providerReceiver: providerReceiver.account.address,
          clientReceiver: clientReceiver.account.address,
          feeBPS,
          treasury,
          details: '',
        },
      );
      const address = await awaitInvoiceAddress(tx);
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      await setBalanceOf(mockToken.address, tempInvoice.address, total);

      const beforeProviderBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );
      const beforeTreasuryBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, treasury)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            treasury,
          );

      const releaseHash = await tempInvoice.write.release([0n], {
        account: client.account,
      });

      const milestoneAmount = amounts[0];
      const expectedFee = (milestoneAmount * feeBPS) / 10000n;
      const expectedProviderAmount = milestoneAmount - expectedFee;

      const afterProviderBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );
      const afterTreasuryBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, treasury)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            treasury,
          );

      expect(afterProviderBalance).to.equal(
        beforeProviderBalance + expectedProviderAmount,
      );
      expect(afterTreasuryBalance).to.equal(
        beforeTreasuryBalance + expectedFee,
      );

      // Check for FeeTransferred event
      await expect(releaseHash)
        .to.emit(tempInvoice, 'FeeTransferred')
        .withArgs(
          getAddress(mockToken.address),
          expectedFee,
          getAddress(treasury),
        );
    });

    it('Should deduct fees on client withdrawal', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
        randomSigner,
        total,
        testClient,
        mockSplitsWarehouse,
      } = ctx();

      const feeBPS = 500n; // 5%
      const treasury = randomSigner.account.address;
      const terminationTime = (await currentTimestamp()) + 1000;

      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(terminationTime),
          requireVerification: true,
          providerReceiver: providerReceiver.account.address,
          clientReceiver: clientReceiver.account.address,
          feeBPS,
          treasury,
          details: '',
        },
      );
      const address = await awaitInvoiceAddress(tx);
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      await setBalanceOf(mockToken.address, tempInvoice.address, total);
      await testClient.increaseTime({ seconds: terminationTime + 1000 });

      const beforeClientBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const beforeTreasuryBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, treasury)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            treasury,
          );

      const withdrawHash = await tempInvoice.write.withdraw({
        account: client.account,
      });

      const expectedFee = (total * feeBPS) / 10000n;
      const expectedClientAmount = total - expectedFee;

      const afterClientBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const afterTreasuryBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, treasury)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            treasury,
          );

      expect(afterClientBalance).to.equal(
        beforeClientBalance + expectedClientAmount,
      );
      expect(afterTreasuryBalance).to.equal(
        beforeTreasuryBalance + expectedFee,
      );

      // Check for FeeTransferred event
      await expect(withdrawHash)
        .to.emit(tempInvoice, 'FeeTransferred')
        .withArgs(
          getAddress(mockToken.address),
          expectedFee,
          getAddress(treasury),
        );
    });

    it('Should handle different fee percentages correctly', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
        randomSigner,
        total,
        mockSplitsWarehouse,
      } = ctx();

      // Test 1.5% fee
      const feeBPS = 150n; // 1.5%
      const treasury = randomSigner.account.address;

      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(
            (await currentTimestamp()) + 30 * 24 * 60 * 60,
          ),
          requireVerification: true,
          providerReceiver: providerReceiver.account.address,
          clientReceiver: clientReceiver.account.address,
          feeBPS,
          treasury,
          details: '',
        },
      );
      const address = await awaitInvoiceAddress(tx);
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      await setBalanceOf(mockToken.address, tempInvoice.address, total);

      const beforeTreasuryBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, treasury)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            treasury,
          );

      await tempInvoice.write.release([0n], {
        account: client.account,
      });

      const milestoneAmount = amounts[0];
      const expectedFee = (milestoneAmount * feeBPS) / 10000n;

      const afterTreasuryBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, treasury)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            treasury,
          );

      expect(afterTreasuryBalance).to.equal(
        beforeTreasuryBalance + expectedFee,
      );
    });

    it('Should work with custom receiver addresses and fees', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        providerReceiver2,
        clientReceiver2,
        randomSigner,
        total,
        mockSplitsWarehouse,
      } = ctx();

      const feeBPS = 750n; // 7.5%
      const treasury = randomSigner.account.address;

      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(
            (await currentTimestamp()) + 30 * 24 * 60 * 60,
          ),
          requireVerification: true,
          providerReceiver: providerReceiver2.account.address, // Different receiver
          clientReceiver: clientReceiver2.account.address, // Different receiver
          feeBPS,
          treasury,
          details: '',
        },
      );
      const address = await awaitInvoiceAddress(tx);
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      await setBalanceOf(mockToken.address, tempInvoice.address, total);

      const beforeProviderBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver2.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver2.account.address,
          );
      const beforeTreasuryBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, treasury)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            treasury,
          );

      await tempInvoice.write.release([0n], {
        account: client.account,
      });

      const milestoneAmount = amounts[0];
      const expectedFee = (milestoneAmount * feeBPS) / 10000n;
      const expectedProviderAmount = milestoneAmount - expectedFee;

      const afterProviderBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver2.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver2.account.address,
          );
      const afterTreasuryBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, treasury)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            treasury,
          );

      expect(afterProviderBalance).to.equal(
        beforeProviderBalance + expectedProviderAmount,
      );
      expect(afterTreasuryBalance).to.equal(
        beforeTreasuryBalance + expectedFee,
      );
    });

    it('Should not charge fees when feeBPS is 0', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
        mockSplitsWarehouse,
      } = ctx();

      const feeBPS = 0n;
      const treasury = zeroAddress; // Can be zero address when feeBPS is 0

      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(
            (await currentTimestamp()) + 30 * 24 * 60 * 60,
          ),
          requireVerification: true,
          providerReceiver: providerReceiver.account.address,
          clientReceiver: clientReceiver.account.address,
          feeBPS,
          treasury,
          details: '',
        },
      );
      const address = await awaitInvoiceAddress(tx);
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      await setBalanceOf(mockToken.address, tempInvoice.address, amounts[0]);

      const beforeProviderBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      const releaseHash = await tempInvoice.write.release([0n], {
        account: client.account,
      });

      const afterProviderBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      // Should receive full milestone amount without fees
      expect(afterProviderBalance).to.equal(beforeProviderBalance + amounts[0]);

      // Should not emit FeeTransferred event when no fees
      await expect(releaseHash).not.to.emit(tempInvoice, 'FeeTransferred');
    });
  });
}

import { expect } from 'chai';
import { viem } from 'hardhat';
import { getAddress, zeroAddress, zeroHash } from 'viem';

import {
  awaitInvoiceAddress,
  createVariantLockedEscrow,
  currentTimestamp,
  deployEscrow,
  setBalanceOf,
  SuiteCtx,
  VariantName,
} from '../helpers';

// eslint-disable-next-line mocha/no-exports
export function withdrawOperationsTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Withdraw Operations', function () {
    it('Should revert withdraw before terminationTime', async function () {
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
      } = ctx();

      const currentTime = await currentTimestamp();
      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(currentTime) + 3600n,
          requireVerification: false,
          providerReceiver: getAddress(providerReceiver.account.address),
          clientReceiver: getAddress(clientReceiver.account.address),
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );

      const escrowAddress = await awaitInvoiceAddress(tx);
      const escrow = await viem.getContractAt(
        'SmartInvoiceEscrowCore',
        escrowAddress!,
      );

      const receipt = escrow.write.withdraw();
      await expect(receipt).to.revertedWithCustomError(escrow, 'NotTerminated');
    });

    it('Should withdraw after terminationTime', async function () {
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
        testClient,
      } = ctx();

      const currentTime = await currentTimestamp();
      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(currentTime) + 1000n,
          requireVerification: false,
          providerReceiver: getAddress(providerReceiver.account.address),
          clientReceiver: getAddress(clientReceiver.account.address),
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );

      const escrowAddress = await awaitInvoiceAddress(tx);
      const escrow = await viem.getContractAt(
        'SmartInvoiceEscrowCore',
        escrowAddress!,
      );

      await testClient.increaseTime({ seconds: 1000 });
      await setBalanceOf(mockToken.address, escrow.address, 10n);

      const receipt = await escrow.write.withdraw();
      expect(await escrow.read.milestone()).to.equal(2n);
      await expect(receipt).to.emit(escrow, 'Withdraw').withArgs(10n);
    });

    it('Should revert withdraw with zero balance', async function () {
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
        testClient,
      } = ctx();

      const currentTime = await currentTimestamp();
      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(currentTime) + 1000n,
          requireVerification: false,
          providerReceiver: getAddress(providerReceiver.account.address),
          clientReceiver: getAddress(clientReceiver.account.address),
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );

      const escrowAddress = await awaitInvoiceAddress(tx);
      const escrow = await viem.getContractAt(
        'SmartInvoiceEscrowCore',
        escrowAddress!,
      );

      await testClient.increaseTime({ seconds: 1000 });
      // Don't set any balance

      await expect(escrow.write.withdraw()).to.be.revertedWithCustomError(
        escrow,
        'BalanceIsZero',
      );
    });

    it('Should revert withdraw if locked', async function () {
      const {
        client,
        mockToken,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
        testClient,
      } = ctx();

      // Skip this test for variants that don't support locking
      if (!variant.capabilities.lock) {
        this.skip();
      }

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(await currentTimestamp()) + 1000n,
          requireVerification: false,
          providerReceiver: getAddress(providerReceiver.account.address),
          clientReceiver: getAddress(clientReceiver.account.address),
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
        zeroHash,
      );

      await testClient.increaseTime({ seconds: 2000 });
      await expect(
        lockedInvoice.write.withdraw(),
      ).to.be.revertedWithCustomError(lockedInvoice, 'Locked');
    });
  });
}

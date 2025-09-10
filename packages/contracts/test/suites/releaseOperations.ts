import { expect } from 'chai';
import { ContractTypesMap } from 'hardhat/types';
import { getAddress, zeroHash } from 'viem';

import {
  awaitInvoiceAddress,
  deployEscrow,
  getBalanceOf,
  getLockedEscrow,
  setBalanceOf,
} from '../helpers';
import { SuiteCtx, VariantName } from '../helpers/variants';

// eslint-disable-next-line mocha/no-exports
export function releaseOperationsTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Release Operations', function () {
    it('Should revert release by non client', async function () {
      const { escrow, provider } = ctx();
      await expect(
        escrow.write.release({ account: provider.account }),
      ).to.be.revertedWithCustomError(escrow, 'NotClient');
    });

    it('Should revert release with low balance', async function () {
      const { escrow, mockToken } = ctx();
      await setBalanceOf(mockToken.address, escrow.address, 5n);
      await expect(escrow.write.release()).to.be.revertedWithCustomError(
        escrow,
        'InsufficientBalance',
      );
    });

    it('Should release', async function () {
      const { escrow, mockToken, providerReceiver } = ctx();
      await setBalanceOf(mockToken.address, escrow.address, 10n);
      const beforeBalance = await getBalanceOf(
        mockToken.address,
        providerReceiver.account.address,
      );
      const receipt = await escrow.write.release();
      expect(await escrow.read.released()).to.equal(10n);
      expect(await escrow.read.milestone()).to.equal(1n);
      await expect(receipt).to.emit(escrow, 'Release').withArgs(0n, 10n);
      const afterBalance = await getBalanceOf(
        mockToken.address,
        providerReceiver.account.address,
      );
      expect(afterBalance).to.equal(beforeBalance + 10n);
    });

    it('Should auto-verify client on first release() call', async function () {
      const { escrow, mockToken, client } = ctx();

      // Ensure invoice starts unverified since requireVerification is true
      expect(await escrow.read.verified()).to.equal(false);

      await setBalanceOf(mockToken.address, escrow.address, 10n);
      const receipt = await escrow.write.release();

      // Should emit both Verified and Release events
      await expect(receipt)
        .to.emit(escrow, 'Verified')
        .withArgs(getAddress(client.account.address), escrow.address);
      await expect(receipt).to.emit(escrow, 'Release').withArgs(0n, 10n);

      // Should now be verified
      expect(await escrow.read.verified()).to.equal(true);

      // Subsequent releases should not emit Verified event again
      await setBalanceOf(mockToken.address, escrow.address, 10n);
      const receipt2 = await escrow.write.release();
      await expect(receipt2).to.not.emit(escrow, 'Verified');
      await expect(receipt2).to.emit(escrow, 'Release').withArgs(1n, 10n);
    });

    it('Should release full balance at last milestone', async function () {
      const { escrow, mockToken, providerReceiver } = ctx();

      await setBalanceOf(mockToken.address, escrow.address, 10n);
      const beforeBalance = await getBalanceOf(
        mockToken.address,
        providerReceiver.account.address,
      );
      let receipt = await escrow.write.release();
      expect(await escrow.read.released()).to.equal(10n);
      expect(await escrow.read.milestone()).to.equal(1n);
      await expect(receipt).to.emit(escrow, 'Release').withArgs(0n, 10n);

      await setBalanceOf(mockToken.address, escrow.address, 15n);
      receipt = await escrow.write.release();
      expect(await escrow.read.released()).to.equal(25n);
      expect(await escrow.read.milestone()).to.equal(2n);
      await expect(receipt).to.emit(escrow, 'Release').withArgs(1n, 15n);

      const afterBalance = await getBalanceOf(
        mockToken.address,
        providerReceiver.account.address,
      );
      expect(afterBalance).to.equal(beforeBalance + 25n);
    });

    it('Should release with milestone number', async function () {
      const { escrow, mockToken } = ctx();

      await setBalanceOf(mockToken.address, escrow.address, 10n);
      const receipt = await escrow.write.release([0n]);
      expect(await escrow.read.released()).to.equal(10n);
      expect(await escrow.read.milestone()).to.equal(1n);
      await expect(receipt).to.emit(escrow, 'Release').withArgs(0n, 10n);
    });

    it('Should auto-verify client on first release(milestone) call', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        terminationTime,
      } = ctx();

      // Create a fresh invoice for this test to ensure unverified state
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
          providerReceiver: getAddress(
            '0x0000000000000000000000000000000000000000',
          ),
          clientReceiver: getAddress(
            '0x0000000000000000000000000000000000000000',
          ),
          feeBPS: 0n,
          treasury: getAddress('0x0000000000000000000000000000000000000000'),
          details: '',
        },
      );
      const tempAddress = await awaitInvoiceAddress(tx);

      // Get contract instance for the temp address
      const { getEscrowAt } = await import('../helpers/variants');
      const tempInvoice = (await getEscrowAt(
        variant.contract,
        tempAddress!,
      )) as unknown as ContractTypesMap['SmartInvoiceEscrowCore'];

      // Ensure invoice starts unverified
      expect(await tempInvoice.read.verified()).to.equal(false);

      await setBalanceOf(mockToken.address, tempAddress!, 10n);
      const receipt = await tempInvoice.write.release([0n], {
        account: client.account,
      });

      // Should emit both Verified and Release events
      await expect(receipt)
        .to.emit(tempInvoice, 'Verified')
        .withArgs(getAddress(client.account.address), tempInvoice.address);
      await expect(receipt).to.emit(tempInvoice, 'Release').withArgs(0n, 10n);

      // Should now be verified
      expect(await tempInvoice.read.verified()).to.equal(true);
    });

    it('Should revert release milestone below current', async function () {
      const { escrow, mockToken } = ctx();

      await setBalanceOf(mockToken.address, escrow.address, 10n);
      await escrow.write.release([0n]); // Release milestone 0

      // Try to release milestone 0 again
      await expect(escrow.write.release([0n])).to.be.revertedWithCustomError(
        escrow,
        'InvalidMilestone',
      );
    });

    it('Should revert release milestone above max', async function () {
      const { escrow, mockToken } = ctx();

      await setBalanceOf(mockToken.address, escrow.address, 10n);

      // Try to release milestone beyond array length
      await expect(escrow.write.release([5n])).to.be.revertedWithCustomError(
        escrow,
        'InvalidMilestone',
      );
    });

    it('Should release remaining balance after all milestones', async function () {
      const { escrow, mockToken } = ctx();

      // Complete all milestones first
      await setBalanceOf(mockToken.address, escrow.address, 20n);
      await escrow.write.release([1n]); // Release both milestones
      expect(await escrow.read.milestone()).to.equal(2n);

      // Add more tokens and release remaining
      await setBalanceOf(mockToken.address, escrow.address, 5n);
      const receipt = await escrow.write.release();
      await expect(receipt).to.emit(escrow, 'ReleaseRemainder').withArgs(5n);
    });

    it('Should revert release remaining balance when zero', async function () {
      const { escrow, mockToken } = ctx();

      // Complete all milestones first
      await setBalanceOf(mockToken.address, escrow.address, 20n);
      await escrow.write.release([1n]); // Release both milestones

      // Try to release when no balance
      await expect(escrow.write.release()).to.be.revertedWithCustomError(
        escrow,
        'BalanceIsZero',
      );
    });

    it('Should revert release if locked', async function () {
      // Skip this test for minimal variants that don't have locking
      if (!ctx().variant.capabilities.lock) {
        this.skip();
      }

      const {
        factory,
        client,
        provider,
        resolver,
        mockToken,
        amounts,
        mockWrappedETH,
      } = ctx();

      const lockedInvoice = await getLockedEscrow(
        factory,
        client.account.address,
        provider.account.address,
        resolver.account.address,
        mockToken.address,
        amounts,
        zeroHash,
        mockWrappedETH.address,
      );
      expect(lockedInvoice.write.release()).to.be.revertedWithCustomError(
        lockedInvoice,
        'Locked',
      );
    });
  });
}

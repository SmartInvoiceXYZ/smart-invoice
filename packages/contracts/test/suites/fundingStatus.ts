import { expect } from 'chai';

import { setBalanceOf } from '../helpers';
import { SuiteCtx, VariantName } from '../helpers/variants';

// eslint-disable-next-line mocha/no-exports
export function fundingStatusTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Funding Status', function () {
    it('Should return false for isFullyFunded when no funds deposited', async function () {
      const { escrow } = ctx();
      expect(await escrow.read.isFullyFunded()).to.equal(false);
    });

    it('Should return true for isFullyFunded when fully funded', async function () {
      const { escrow, mockToken, total } = ctx();
      await setBalanceOf(mockToken.address, escrow.address, total);
      expect(await escrow.read.isFullyFunded()).to.equal(true);
    });

    it('Should return true for isFullyFunded after partial release when total funds available', async function () {
      const { escrow, mockToken, total, client } = ctx();

      // Fund the contract with total amount
      await setBalanceOf(mockToken.address, escrow.address, total);

      // Release first milestone
      await escrow.write.release({ account: client.account });

      // Should still be considered fully funded since released + balance >= total
      expect(await escrow.read.isFullyFunded()).to.equal(true);
    });

    it('Should return false for isFunded when milestone out of bounds', async function () {
      const { escrow } = ctx();
      await expect(escrow.read.isFunded([999n])).to.be.revertedWithCustomError(
        escrow,
        'InvalidMilestone',
      );
    });

    it('Should return false for isFunded when insufficient funds for milestone', async function () {
      const { escrow } = ctx();
      // Don't fund the contract
      expect(await escrow.read.isFunded([0n])).to.equal(false);
    });

    it('Should return true for isFunded when sufficient funds for specific milestone', async function () {
      const { escrow, mockToken, amounts } = ctx();
      // Fund with enough for first milestone
      await setBalanceOf(mockToken.address, escrow.address, amounts[0]);
      expect(await escrow.read.isFunded([0n])).to.equal(true);
    });

    it('Should return true for isFunded when checking past milestones', async function () {
      const { escrow, mockToken, total, client } = ctx();

      // Fund and release first milestone
      await setBalanceOf(mockToken.address, escrow.address, total);
      await escrow.write.release({ account: client.account });

      // Should return true for milestone 0 since it's already released
      expect(await escrow.read.isFunded([0n])).to.equal(true);
    });

    it('Should correctly calculate required amount for future milestones', async function () {
      const { escrow, mockToken, amounts } = ctx();

      // Fund with enough for first two milestones
      const requiredForTwo = amounts[0] + amounts[1];
      await setBalanceOf(mockToken.address, escrow.address, requiredForTwo);

      expect(await escrow.read.isFunded([0n])).to.equal(true);
      expect(await escrow.read.isFunded([1n])).to.equal(true);
    });
  });
}

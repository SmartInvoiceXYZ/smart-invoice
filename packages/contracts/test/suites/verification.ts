import { expect } from 'chai';
import { getAddress } from 'viem';

import { SuiteCtx, VariantName } from '../helpers';

// eslint-disable-next-line mocha/no-exports
export function verificationTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Verification', function () {
    it('Should emit Verified when client calls verify()', async function () {
      const { client, escrow } = ctx();

      await expect(escrow.write.verify({ account: client.account }))
        .to.emit(escrow, 'Verified')
        .withArgs(getAddress(client.account.address), escrow.address);
    });

    it('Should not emit Verified if caller !client', async function () {
      const { randomSigner, escrow } = ctx();

      await expect(escrow.write.verify({ account: randomSigner.account })).to.be
        .reverted;
    });
  });
}

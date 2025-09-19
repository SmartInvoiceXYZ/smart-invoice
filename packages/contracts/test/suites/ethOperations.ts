import { expect } from 'chai';
import { getAddress, zeroAddress } from 'viem';

import {
  awaitInvoiceAddress,
  currentTimestamp,
  deployEscrow,
  getEscrowAt,
  SuiteCtx,
  VariantName,
} from '../helpers';

// eslint-disable-next-line mocha/no-exports
export function ethOperationsTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('ETH Operations', function () {
    it('Should revert receive if not wrappedETH', async function () {
      const { client, escrow } = ctx();

      const receipt = client.sendTransaction({
        to: escrow.address,
        value: 10n,
      });
      await expect(receipt).to.be.revertedWithCustomError(
        escrow,
        'InvalidWrappedETH',
      );
    });

    it('Should accept receive and convert to wrapped token', async function () {
      const {
        factory,
        client,
        provider,
        mockWrappedETH,
        amounts,
        variant,
        resolverData,
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
          token: mockWrappedETH.address,
          terminationTime: BigInt(currentTime + 3600),
          requireVerification: false,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );
      const escrowAddress = await awaitInvoiceAddress(tx);
      const escrow = await getEscrowAt(variant.contract, escrowAddress!);

      const receipt = await client.sendTransaction({
        to: escrow.address,
        value: 10n,
      });
      await expect(receipt)
        .to.emit(escrow, 'Deposit')
        .withArgs(
          getAddress(client.account.address),
          10,
          getAddress(mockWrappedETH.address),
        );
      expect(await mockWrappedETH.read.balanceOf([escrow.address])).to.equal(
        10,
      );
    });

    it('Should wrapETH from contract balance', async function () {
      const {
        factory,
        client,
        provider,
        mockWrappedETH,
        amounts,
        variant,
        resolverData,
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
          token: mockWrappedETH.address,
          terminationTime: BigInt(currentTime + 3600),
          requireVerification: false,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );
      const escrowAddress = await awaitInvoiceAddress(tx);
      const escrow = await getEscrowAt(variant.contract, escrowAddress!);

      // Simulate ETH received via self-destruct by manually sending ETH to mockWETH
      // then transferring it to invoice address to simulate contract ETH balance
      await client.sendTransaction({
        to: mockWrappedETH.address,
        value: 25n,
      });
      await mockWrappedETH.write.transfer([escrow.address, 25n]);

      // Now manually set the ETH balance on the invoice contract to simulate self-destruct
      await testClient.setBalance({
        address: escrow.address,
        value: 15n, // Set direct ETH balance
      });

      const beforeWrapBalance = await mockWrappedETH.read.balanceOf([
        escrow.address,
      ]);
      const receipt = await escrow.write.wrapETH();

      await expect(receipt).to.emit(escrow, 'WrappedStrayETH').withArgs(15);

      await expect(receipt)
        .to.emit(escrow, 'Deposit')
        .withArgs(escrow.address, 15, getAddress(mockWrappedETH.address));

      const afterWrapBalance = await mockWrappedETH.read.balanceOf([
        escrow.address,
      ]);
      expect(afterWrapBalance).to.equal(beforeWrapBalance + 15n);
    });

    it('Should wrapETH without deposit event if not main token', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
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
          token: mockToken.address, // Different token, not wrapped ETH
          terminationTime: BigInt(currentTime + 3600),
          requireVerification: false,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );
      const escrowAddress = await awaitInvoiceAddress(tx);
      const escrow = await getEscrowAt(variant.contract, escrowAddress!);

      // Set ETH balance to wrap
      await testClient.setBalance({
        address: escrow.address,
        value: 20n,
      });

      const receipt = await escrow.write.wrapETH();

      await expect(receipt).to.emit(escrow, 'WrappedStrayETH').withArgs(20);

      // Should NOT emit Deposit event since token != WRAPPED_ETH
      await expect(receipt).not.to.emit(escrow, 'Deposit');
    });

    it('Should revert wrapETH with zero balance', async function () {
      const { escrow } = ctx();

      // Contract should have 0 ETH balance by default
      await expect(escrow.write.wrapETH()).to.be.revertedWithCustomError(
        escrow,
        'BalanceIsZero',
      );
    });
  });
}

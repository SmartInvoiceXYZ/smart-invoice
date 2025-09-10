import { expect } from 'chai';
import { getAddress, zeroAddress } from 'viem';

import { getBalanceOf, getSplitsBalanceOf, setBalanceOf } from '../helpers';
import { SuiteCtx, VariantName } from '../helpers/variants';

// eslint-disable-next-line mocha/no-exports
export function addressUpdateFunctionalityTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Address Update Functionality', function () {
    it('Should deploy with receiver addresses', async function () {
      const { providerReceiver, clientReceiver, escrow } = ctx();

      expect(await escrow.read.providerReceiver()).to.equal(
        getAddress(providerReceiver.account.address),
      );
      expect(await escrow.read.clientReceiver()).to.equal(
        getAddress(clientReceiver.account.address),
      );
    });

    it('Should allow the client to update their address', async function () {
      const { client, client2, escrow } = ctx();

      const receipt = await escrow.write.updateClient(
        [client2.account.address],
        {
          account: client.account,
        },
      );
      expect(await escrow.read.client()).to.equal(
        getAddress(client2.account.address),
      );
      await expect(receipt)
        .to.emit(escrow, 'UpdatedClient')
        .withArgs(
          getAddress(client.account.address),
          getAddress(client2.account.address),
        );
    });

    it('Should revert the client update if not the client', async function () {
      const { provider, client2, escrow } = ctx();

      await expect(
        escrow.write.updateClient([client2.account.address], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'NotClient');
    });

    it('Should revert client update with zero address', async function () {
      const { client, escrow } = ctx();

      await expect(
        escrow.write.updateClient([zeroAddress], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'InvalidClient');
    });

    it('Should allow the provider to update their address', async function () {
      const { provider, provider2, escrow } = ctx();

      const receipt = await escrow.write.updateProvider(
        [provider2.account.address],
        {
          account: provider.account,
        },
      );
      expect(await escrow.read.provider()).to.equal(
        getAddress(provider2.account.address),
      );
      await expect(receipt)
        .to.emit(escrow, 'UpdatedProvider')
        .withArgs(
          getAddress(provider.account.address),
          getAddress(provider2.account.address),
        );
    });

    it('Should revert provider update if not the provider', async function () {
      const { client, provider2, escrow } = ctx();

      await expect(
        escrow.write.updateProvider([provider2.account.address], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'NotProvider');
    });

    it('Should revert provider update with zero address', async function () {
      const { provider, escrow } = ctx();

      await expect(
        escrow.write.updateProvider([zeroAddress], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'InvalidProvider');
    });

    it('Should allow the provider to update their receiving address', async function () {
      const { provider, providerReceiver, providerReceiver2, escrow } = ctx();

      const receipt = await escrow.write.updateProviderReceiver(
        [providerReceiver2.account.address],
        { account: provider.account },
      );
      expect(await escrow.read.providerReceiver()).to.equal(
        getAddress(providerReceiver2.account.address),
      );
      await expect(receipt)
        .to.emit(escrow, 'UpdatedProviderReceiver')
        .withArgs(
          getAddress(providerReceiver.account.address),
          getAddress(providerReceiver2.account.address),
        );
    });

    it('Should revert provider receiver update if not the provider', async function () {
      const { client, providerReceiver2, escrow } = ctx();

      await expect(
        escrow.write.updateProviderReceiver(
          [providerReceiver2.account.address],
          { account: client.account },
        ),
      ).to.be.revertedWithCustomError(escrow, 'NotProvider');
    });

    it('Should revert provider receiver update with contract address', async function () {
      const { provider, escrow } = ctx();

      await expect(
        escrow.write.updateProviderReceiver([escrow.address], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'InvalidProviderReceiver');
    });

    it('Should allow the client to update their receiving address', async function () {
      const { client, clientReceiver, clientReceiver2, escrow } = ctx();

      const receipt = await escrow.write.updateClientReceiver(
        [clientReceiver2.account.address],
        {
          account: client.account,
        },
      );
      expect(await escrow.read.clientReceiver()).to.equal(
        getAddress(clientReceiver2.account.address),
      );
      await expect(receipt)
        .to.emit(escrow, 'UpdatedClientReceiver')
        .withArgs(
          getAddress(clientReceiver.account.address),
          getAddress(clientReceiver2.account.address),
        );
    });

    it('Should revert client receiver update if not the client', async function () {
      const { provider, clientReceiver2, escrow } = ctx();

      await expect(
        escrow.write.updateClientReceiver([clientReceiver2.account.address], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'NotClient');
    });

    it('Should revert client receiver update with contract address', async function () {
      const { client, escrow } = ctx();

      await expect(
        escrow.write.updateClientReceiver([escrow.address], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'InvalidClientReceiver');
    });

    it('Should send payments to providerReceiver when set', async function () {
      const {
        client,
        mockToken,
        providerReceiver,
        escrow,
        mockSplitsWarehouse,
        variant,
      } = ctx();

      await setBalanceOf(mockToken.address, escrow.address, 10n);
      const beforeBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );
      await escrow.write.release({ account: client.account });
      const afterBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );
      expect(afterBalance).to.equal(beforeBalance + 10n);
    });

    it('Should send withdrawals to clientReceiver when set', async function () {
      const {
        client,
        clientReceiver,
        mockToken,
        testClient,
        escrow,
        variant,
        mockSplitsWarehouse,
      } = ctx();

      await testClient.increaseTime({ seconds: 30 * 24 * 60 * 60 });
      await setBalanceOf(mockToken.address, escrow.address, 10n);

      const beforeBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      await escrow.write.withdraw({ account: client.account });
      const afterBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      expect(afterBalance).to.equal(beforeBalance + 10n);
    });

    it('Should send payments to updated providerReceiver after address change', async function () {
      const {
        provider,
        client,
        mockToken,
        providerReceiver,
        providerReceiver2,
        escrow,
        variant,
        mockSplitsWarehouse,
      } = ctx();

      // First update the provider receiver to providerReceiver2
      await escrow.write.updateProviderReceiver(
        [providerReceiver2.account.address],
        { account: provider.account },
      );

      await setBalanceOf(mockToken.address, escrow.address, 10n);

      const beforeBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver2.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver2.account.address,
          );
      const beforeOriginalBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      await escrow.write.release({ account: client.account });

      const afterBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver2.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver2.account.address,
          );
      const afterOriginalBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      // Payment should go to the NEW receiver
      expect(afterBalance).to.equal(beforeBalance + 10n);
      // Original receiver should not receive anything
      expect(afterOriginalBalance).to.equal(beforeOriginalBalance);
    });

    it('Should send withdrawals to updated clientReceiver after address change', async function () {
      const {
        client,
        clientReceiver,
        clientReceiver2,
        mockToken,
        testClient,
        escrow,
        variant,
        mockSplitsWarehouse,
      } = ctx();

      // Update client receiver to clientReceiver2
      await escrow.write.updateClientReceiver(
        [clientReceiver2.account.address],
        { account: client.account },
      );

      await testClient.increaseTime({ seconds: 30 * 24 * 60 * 60 });
      await setBalanceOf(mockToken.address, escrow.address, 10n);

      const beforeBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver2.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver2.account.address,
          );
      const beforeOriginalBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );

      await escrow.write.withdraw({ account: client.account });

      const afterBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver2.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver2.account.address,
          );
      const afterOriginalBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );

      // Withdrawal should go to the NEW receiver
      expect(afterBalance).to.equal(beforeBalance + 10n);
      // Original receiver should not receive anything
      expect(afterOriginalBalance).to.equal(beforeOriginalBalance);
    });
  });
}

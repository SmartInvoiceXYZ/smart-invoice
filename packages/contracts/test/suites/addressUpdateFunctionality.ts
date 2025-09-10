import { expect } from 'chai';
import { getAddress, zeroAddress } from 'viem';

import {
  awaitInvoiceAddress,
  currentTimestamp,
  deployEscrow,
  getBalanceOf,
  setBalanceOf,
} from '../helpers';
import { SuiteCtx, VariantName } from '../helpers/variants';

// eslint-disable-next-line mocha/no-exports
export function addressUpdateFunctionalityTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Address Update Functionality', function () {
    let updatableInvoice: Awaited<ReturnType<typeof ctx>>['escrow'];

    beforeEach(async function () {
      const {
        factory,
        client,
        provider,
        providerReceiver,
        clientReceiver,
        resolverData,
        mockToken,
        terminationTime,
        requireVerification,
        amounts,
        variant,
      } = ctx();

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
          requireVerification,
          providerReceiver: getAddress(providerReceiver.account.address),
          clientReceiver: getAddress(clientReceiver.account.address),
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );

      const address = await awaitInvoiceAddress(tx);
      const { getEscrowAt } = await import('../helpers/variants');
      updatableInvoice = await getEscrowAt(variant.contract, address!);
    });

    it('Should deploy with receiver addresses', async function () {
      const { providerReceiver, clientReceiver } = ctx();

      expect(await updatableInvoice.read.providerReceiver()).to.equal(
        getAddress(providerReceiver.account.address),
      );
      expect(await updatableInvoice.read.clientReceiver()).to.equal(
        getAddress(clientReceiver.account.address),
      );
    });

    it('Should allow the client to update their address', async function () {
      const { client, client2 } = ctx();

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
        .withArgs(
          getAddress(client.account.address),
          getAddress(client2.account.address),
        );
    });

    it('Should revert the client update if not the client', async function () {
      const { provider, client2 } = ctx();

      await expect(
        updatableInvoice.write.updateClient([client2.account.address], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(updatableInvoice, 'NotClient');
    });

    it('Should revert client update with zero address', async function () {
      const { client } = ctx();

      await expect(
        updatableInvoice.write.updateClient([zeroAddress], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(updatableInvoice, 'InvalidClient');
    });

    it('Should allow the provider to update their address', async function () {
      const { provider, provider2 } = ctx();

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
        .withArgs(
          getAddress(provider.account.address),
          getAddress(provider2.account.address),
        );
    });

    it('Should revert provider update if not the provider', async function () {
      const { client, provider2 } = ctx();

      await expect(
        updatableInvoice.write.updateProvider([provider2.account.address], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(updatableInvoice, 'NotProvider');
    });

    it('Should revert provider update with zero address', async function () {
      const { provider } = ctx();

      await expect(
        updatableInvoice.write.updateProvider([zeroAddress], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(updatableInvoice, 'InvalidProvider');
    });

    it('Should allow the provider to update their receiving address', async function () {
      const { provider, providerReceiver, providerReceiver2 } = ctx();

      const receipt = await updatableInvoice.write.updateProviderReceiver(
        [providerReceiver2.account.address],
        { account: provider.account },
      );
      expect(await updatableInvoice.read.providerReceiver()).to.equal(
        getAddress(providerReceiver2.account.address),
      );
      await expect(receipt)
        .to.emit(updatableInvoice, 'UpdatedProviderReceiver')
        .withArgs(
          getAddress(providerReceiver.account.address),
          getAddress(providerReceiver2.account.address),
        );
    });

    it('Should revert provider receiver update if not the provider', async function () {
      const { client, providerReceiver2 } = ctx();

      await expect(
        updatableInvoice.write.updateProviderReceiver(
          [providerReceiver2.account.address],
          { account: client.account },
        ),
      ).to.be.revertedWithCustomError(updatableInvoice, 'NotProvider');
    });

    it('Should revert provider receiver update with contract address', async function () {
      const { provider } = ctx();

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
      const { client, clientReceiver, clientReceiver2 } = ctx();

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
        .withArgs(
          getAddress(clientReceiver.account.address),
          getAddress(clientReceiver2.account.address),
        );
    });

    it('Should revert client receiver update if not the client', async function () {
      const { provider, clientReceiver2 } = ctx();

      await expect(
        updatableInvoice.write.updateClientReceiver(
          [clientReceiver2.account.address],
          { account: provider.account },
        ),
      ).to.be.revertedWithCustomError(updatableInvoice, 'NotClient');
    });

    it('Should revert client receiver update with contract address', async function () {
      const { client } = ctx();

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
      const { client, mockToken, providerReceiver } = ctx();

      await setBalanceOf(mockToken.address, updatableInvoice.address, 10n);
      const beforeBalance = await getBalanceOf(
        mockToken.address,
        providerReceiver.account.address,
      );
      await updatableInvoice.write.release([], { account: client.account });
      const afterBalance = await getBalanceOf(
        mockToken.address,
        providerReceiver.account.address,
      );
      expect(afterBalance).to.equal(beforeBalance + 10n);
    });

    it('Should send withdrawals to clientReceiver when set', async function () {
      const {
        factory,
        client,
        provider,
        providerReceiver,
        clientReceiver,
        resolverData,
        mockToken,
        amounts,
        variant,
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
          terminationTime: BigInt(currentTime + 1000),
          requireVerification: false,
          providerReceiver: getAddress(providerReceiver.account.address),
          clientReceiver: getAddress(clientReceiver.account.address),
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );

      const address = await awaitInvoiceAddress(tx);
      const { getEscrowAt } = await import('../helpers/variants');
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      await testClient.increaseTime({ seconds: 1000 });
      await setBalanceOf(mockToken.address, tempInvoice.address, 10n);

      const beforeBalance = await getBalanceOf(
        mockToken.address,
        clientReceiver.account.address,
      );
      await tempInvoice.write.withdraw([], { account: client.account });
      const afterBalance = await getBalanceOf(
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
      } = ctx();

      // First update the provider receiver to providerReceiver2
      await updatableInvoice.write.updateProviderReceiver(
        [providerReceiver2.account.address],
        { account: provider.account },
      );

      await setBalanceOf(mockToken.address, updatableInvoice.address, 10n);

      const beforeBalance = await getBalanceOf(
        mockToken.address,
        providerReceiver2.account.address,
      );
      const beforeOriginalBalance = await getBalanceOf(
        mockToken.address,
        providerReceiver.account.address,
      );

      await updatableInvoice.write.release([], { account: client.account });

      const afterBalance = await getBalanceOf(
        mockToken.address,
        providerReceiver2.account.address,
      );
      const afterOriginalBalance = await getBalanceOf(
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
        factory,
        client,
        provider,
        providerReceiver,
        clientReceiver,
        clientReceiver2,
        resolverData,
        mockToken,
        amounts,
        variant,
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
          terminationTime: BigInt(currentTime + 1000),
          requireVerification: false,
          providerReceiver: getAddress(providerReceiver.account.address),
          clientReceiver: getAddress(clientReceiver.account.address),
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );

      const address = await awaitInvoiceAddress(tx);
      const { getEscrowAt } = await import('../helpers/variants');
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      // Update client receiver to clientReceiver2
      await tempInvoice.write.updateClientReceiver(
        [clientReceiver2.account.address],
        { account: client.account },
      );

      await testClient.increaseTime({ seconds: 1000 });
      await setBalanceOf(mockToken.address, tempInvoice.address, 10n);

      const beforeBalance = await getBalanceOf(
        mockToken.address,
        clientReceiver2.account.address,
      );
      const beforeOriginalBalance = await getBalanceOf(
        mockToken.address,
        clientReceiver.account.address,
      );

      await tempInvoice.write.withdraw([], { account: client.account });

      const afterBalance = await getBalanceOf(
        mockToken.address,
        clientReceiver2.account.address,
      );
      const afterOriginalBalance = await getBalanceOf(
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

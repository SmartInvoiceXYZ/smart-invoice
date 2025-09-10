import { expect } from 'chai';
import { ContractTypesMap } from 'hardhat/types';
import { getAddress, Hex, zeroAddress, zeroHash } from 'viem';

import {
  awaitInvoiceAddress,
  currentTimestamp,
  deployEscrow,
  getBalanceOf,
  getSplitsBalanceOf,
  setBalanceOf,
} from '../helpers';
import {
  createVariantLockedEscrow,
  SuiteCtx,
  VariantName,
} from '../helpers/variants';

// eslint-disable-next-line mocha/no-exports
export function lockAndResolveOperationsTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Lock and Resolve Operations', function () {
    // Skip all lock and resolve tests for minimal variants that don't have locking
    beforeEach(function () {
      if (!ctx().variant.capabilities.lock) {
        this.skip();
      }
    });

    it('Should revert lock if balance is 0', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
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
          token: mockToken.address,
          terminationTime: BigInt(currentTime + 1000),
          requireVerification: true,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
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

      await setBalanceOf(mockToken.address, tempInvoice.address, 0n);

      await expect(
        tempInvoice.write.lock([zeroHash]),
      ).to.be.revertedWithCustomError(tempInvoice, 'BalanceIsZero');
    });

    it('Should lock if balance is greater than 0', async function () {
      const {
        client,
        mockToken,
        providerReceiver,
        clientReceiver,
        resolverData,
      } = ctx();

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
      expect(await lockedInvoice.read.locked()).to.equal(true);
    });

    it('Should emit Lock event by client', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        mockArbitrator,
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
          terminationTime: BigInt(currentTime + 3600),
          requireVerification: true,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
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

      await setBalanceOf(mockToken.address, tempInvoice.address, 10n);
      const disputeURI = 'ipfs://dispute-details';

      // Lock the contract
      let lockValue = 0n;

      // For arbitrable contracts, we need to pay arbitration costs
      if (variant.capabilities.arbitrable) {
        const extraData = (zeroHash + zeroHash.slice(2)) as Hex;
        lockValue = await mockArbitrator.read.arbitrationCost([extraData]);
      }

      const receipt = await tempInvoice.write.lock([disputeURI], {
        value: lockValue,
        account: client.account,
      });

      await expect(receipt)
        .to.emit(tempInvoice, 'Lock')
        .withArgs(getAddress(client.account.address), disputeURI);
    });

    it('Should emit Lock event by provider', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        mockArbitrator,
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
          terminationTime: BigInt(currentTime + 3600),
          requireVerification: true,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
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

      await setBalanceOf(mockToken.address, tempInvoice.address, 10n);
      const disputeURI = 'ipfs://provider-dispute';

      // Lock the contract
      let lockValue = 0n;

      // For arbitrable contracts, we need to pay arbitration costs
      if (variant.capabilities.arbitrable) {
        const extraData = (zeroHash + zeroHash.slice(2)) as Hex;
        lockValue = await mockArbitrator.read.arbitrationCost([extraData]);
      }

      const receipt = await tempInvoice.write.lock([disputeURI], {
        value: lockValue,
        account: provider.account,
      });

      await expect(receipt)
        .to.emit(tempInvoice, 'Lock')
        .withArgs(getAddress(provider.account.address), disputeURI);
    });

    it('Should resolve with correct rewards', async function () {
      const {
        client,
        resolver,
        mockToken,
        variant,
        clientReceiver,
        providerReceiver,
        mockSplitsWarehouse,
        resolverData,
        mockArbitrator,
      } = ctx();

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
      await setBalanceOf(mockToken.address, lockedInvoice.address, 100n);

      const clientBeforeBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerBeforeBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );
      const resolverBeforeBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, resolver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            resolver.account.address,
          );

      if (variant.capabilities.arbitrable) {
        // For arbitrable contracts, use executeRuling via mockArbitrator
        const receipt = mockArbitrator.write.executeRuling([
          lockedInvoice.address,
          1n, // ruling (1 = client wins)
        ]);

        await expect(receipt)
          .to.emit(lockedInvoice, 'Rule')
          .withArgs(getAddress(mockArbitrator.address), 100n, 0n, 1n);
        await expect(receipt)
          .to.emit(lockedInvoice, 'Ruling')
          .withArgs(getAddress(mockArbitrator.address), 1n, 1n);
      } else if (variant.capabilities.resolvable) {
        const resolvableInvoice =
          lockedInvoice as unknown as ContractTypesMap['SmartInvoiceEscrow'];

        // For resolvable contracts, use regular resolve
        const receipt = resolvableInvoice.write.resolve([500n, zeroHash], {
          account: resolver.account,
        });

        await expect(receipt)
          .to.emit(resolvableInvoice, 'Resolve')
          .withArgs(getAddress(resolver.account.address), 5, 90, 5, zeroHash);
      } else {
        // Skip test if variant doesn't support resolution
        this.skip();
      }

      expect(await lockedInvoice.read.released()).to.be.equal(100n);
      expect(await lockedInvoice.read.milestone()).to.be.equal(2n);
      expect(await lockedInvoice.read.locked()).to.be.equal(false);

      const clientAfterBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerAfterBalance = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );
      const resolverAfterBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, resolver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            resolver.account.address,
          );

      if (variant.capabilities.arbitrable) {
        // For arbitrable contracts with ruling 1 (client wins): client gets 100, provider gets 0
        expect(clientAfterBalance).to.be.equal(clientBeforeBalance + 100n);
        expect(providerAfterBalance).to.be.equal(providerBeforeBalance + 0n);
        expect(resolverAfterBalance).to.be.equal(resolverBeforeBalance + 0n);
      } else {
        // For regular resolve: client gets 5, provider gets 90, resolver gets 5
        expect(clientAfterBalance).to.be.equal(clientBeforeBalance + 5n);
        expect(providerAfterBalance).to.be.equal(providerBeforeBalance + 90n);
        expect(resolverAfterBalance).to.be.equal(resolverBeforeBalance + 5n);
      }
    });
  });
}

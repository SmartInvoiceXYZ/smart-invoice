import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import { getAddress, Hex, zeroHash } from 'viem';

import {
  awaitInvoiceAddress,
  currentTimestamp,
  deployEscrow,
  getBalanceOf,
  getLockedEscrow,
  getSplitsBalanceOf,
  setBalanceOf,
} from '../helpers';
import { SuiteCtx, VariantName } from '../helpers/variants';

// eslint-disable-next-line mocha/no-exports
export function tokenReleaseAndWithdrawOperationsTests<
  const V extends VariantName,
>(ctx: () => SuiteCtx<V>) {
  describe('Token Release and Withdraw Operations', function () {
    let mockToken2: Hex;
    let mockToken2Contract: ContractTypesMap['MockToken'];

    beforeEach(async function () {
      mockToken2Contract = await viem.deployContract('MockToken');
      mockToken2 = getAddress(mockToken2Contract.address);
    });

    it('Should releaseTokens for main token (same as release)', async function () {
      const {
        escrow,
        mockToken,
        providerReceiver,
        variant,
        mockSplitsWarehouse,
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

      await escrow.write.releaseTokens([mockToken.address]);
      expect(await escrow.read.released()).to.equal(10n);
      expect(await escrow.read.milestone()).to.equal(1n);

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

    it('Should releaseTokens for different token (full balance)', async function () {
      const { escrow, providerReceiver, variant, mockSplitsWarehouse } = ctx();

      await setBalanceOf(mockToken2, escrow.address, 50n);
      const beforeBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken2, providerReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken2,
            providerReceiver.account.address,
          );

      await escrow.write.releaseTokens([mockToken2]);
      // Should not affect main token milestone
      expect(await escrow.read.milestone()).to.equal(0n);

      const afterBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken2, providerReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken2,
            providerReceiver.account.address,
          );
      expect(afterBalance).to.equal(beforeBalance + 50n);
    });

    it('Should revert releaseTokens if locked', async function () {
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

      await expect(
        lockedInvoice.write.releaseTokens([mockToken2]),
      ).to.be.revertedWithCustomError(lockedInvoice, 'Locked');
    });

    it('Should revert releaseTokens by non-client', async function () {
      const { escrow, provider } = ctx();

      await expect(
        escrow.write.releaseTokens([mockToken2], {
          account: provider.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'NotClient');
    });

    it('Should withdrawTokens for main token after termination', async function () {
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
          token: mockToken.address,
          terminationTime: BigInt(currentTime + 1000),
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

      await testClient.increaseTime({ seconds: 1000 });
      await setBalanceOf(mockToken.address, tempInvoice.address, 10n);

      await tempInvoice.write.withdrawTokens([mockToken.address]);
      expect(await tempInvoice.read.milestone()).to.equal(2n);
    });

    it('Should withdrawTokens for different token after termination', async function () {
      const {
        factory,
        client,
        provider,
        clientReceiver,
        mockToken,
        amounts,
        variant,
        resolverData,
        testClient,
        mockSplitsWarehouse,
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
          providerReceiver: getAddress(
            '0x0000000000000000000000000000000000000000',
          ),
          clientReceiver: getAddress(clientReceiver.account.address),
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

      await testClient.increaseTime({ seconds: 1000 });
      await setBalanceOf(mockToken2, tempInvoice.address, 25n);

      const beforeBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken2, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken2,
            clientReceiver.account.address,
          );

      await tempInvoice.write.withdrawTokens([mockToken2]);

      const afterBalance = variant.capabilities.push
        ? await getBalanceOf(mockToken2, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken2,
            clientReceiver.account.address,
          );
      expect(afterBalance).to.equal(beforeBalance + 25n);
    });

    it('Should revert withdrawTokens if locked', async function () {
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
        terminationTime,
        testClient,
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

      await testClient.increaseTime({ seconds: terminationTime + 1000 });
      await expect(
        lockedInvoice.write.withdrawTokens([mockToken2]),
      ).to.be.revertedWithCustomError(lockedInvoice, 'Locked');
    });

    it('Should revert withdrawTokens with zero balance', async function () {
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
          token: mockToken.address,
          terminationTime: BigInt(currentTime + 1000),
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

      await testClient.increaseTime({ seconds: 1000 });
      // Don't set any balance for mockToken2

      await expect(
        tempInvoice.write.withdrawTokens([mockToken2]),
      ).to.be.revertedWithCustomError(tempInvoice, 'BalanceIsZero');
    });
  });
}

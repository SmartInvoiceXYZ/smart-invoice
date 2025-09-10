import { expect } from 'chai';
import { ContractTypesMap } from 'hardhat/types';
import { getAddress, zeroAddress, zeroHash } from 'viem';

import {
  createVariantLockedEscrow,
  currentTimestamp,
  setBalanceOf,
  SuiteCtx,
  VariantName,
} from '../helpers';

// eslint-disable-next-line mocha/no-exports
export function arbitrationOperationsTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Arbitration Operations', function () {
    // Skip all arbitration tests for non-arbitrable variants
    beforeEach(function () {
      if (!ctx().variant.capabilities.arbitrable) {
        this.skip();
      }
    });

    it('Should rule 1:1 for ruling 0', async function () {
      const {
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        mockArbitrator,
      } = ctx();

      const lockedInvoice = (await createVariantLockedEscrow(
        ctx(),
        {
          client: ctx().client.account.address,
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
      )) as unknown as ContractTypesMap['SmartInvoiceEscrowArbitrable'];

      await setBalanceOf(mockToken.address, lockedInvoice.address, 100n);
      const receipt = mockArbitrator.write.executeRuling([
        lockedInvoice.address,
        0n,
      ]);

      await expect(receipt)
        .to.emit(lockedInvoice, 'Rule')
        .withArgs(getAddress(mockArbitrator.address), 50n, 50n, 0n);
      await expect(receipt)
        .to.emit(lockedInvoice, 'Ruling')
        .withArgs(getAddress(mockArbitrator.address), 1n, 0n);

      expect(await lockedInvoice.read.released()).to.be.equal(100n);
      expect(await lockedInvoice.read.milestone()).to.be.equal(2n);
      expect(await lockedInvoice.read.locked()).to.be.equal(false);
    });

    it('Should rule 1:0 for ruling 1', async function () {
      const {
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        mockArbitrator,
      } = ctx();

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: ctx().client.account.address,
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
      const receipt = mockArbitrator.write.executeRuling([
        lockedInvoice.address,
        1n,
      ]);

      await expect(receipt)
        .to.emit(lockedInvoice, 'Rule')
        .withArgs(getAddress(mockArbitrator.address), 100n, 0n, 1n);
      await expect(receipt)
        .to.emit(lockedInvoice, 'Ruling')
        .withArgs(getAddress(mockArbitrator.address), 1n, 1n);

      expect(await lockedInvoice.read.released()).to.be.equal(100n);
      expect(await lockedInvoice.read.milestone()).to.be.equal(2n);
      expect(await lockedInvoice.read.locked()).to.be.equal(false);
    });

    it('Should rule 0:1 for ruling 2', async function () {
      const {
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        mockArbitrator,
      } = ctx();

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: ctx().client.account.address,
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
      const receipt = mockArbitrator.write.executeRuling([
        lockedInvoice.address,
        2n,
      ]);

      await expect(receipt)
        .to.emit(lockedInvoice, 'Rule')
        .withArgs(getAddress(mockArbitrator.address), 0n, 100n, 2n);
      await expect(receipt)
        .to.emit(lockedInvoice, 'Ruling')
        .withArgs(getAddress(mockArbitrator.address), 1n, 2n);
    });

    it('Should revert rule with invalid ruling', async function () {
      const {
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        mockArbitrator,
      } = ctx();

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: ctx().client.account.address,
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
      await expect(
        mockArbitrator.write.executeRuling([
          lockedInvoice.address,
          5n, // Invalid ruling > NUM_RULING_OPTIONS
        ]),
      ).to.be.revertedWithCustomError(lockedInvoice, 'InvalidRuling');
    });

    it('Should revert rule from non-resolver', async function () {
      const {
        client,
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
      } = ctx();

      const lockedInvoice = (await createVariantLockedEscrow(
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
      )) as unknown as ContractTypesMap['SmartInvoiceEscrowArbitrable'];

      await expect(
        lockedInvoice.write.rule([1n, 1n], { account: client.account }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'NotResolver');
    });

    it('Should revert rule with wrong dispute ID', async function () {
      const {
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        mockArbitrator,
      } = ctx();

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: ctx().client.account.address,
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

      await expect(
        mockArbitrator.write.executeWrongRuling([
          lockedInvoice.address,
          999n, // Wrong dispute ID
          1n,
        ]),
      ).to.be.revertedWithCustomError(lockedInvoice, 'IncorrectDisputeId');
    });

    it('Should revert rule with zero balance', async function () {
      const {
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        mockArbitrator,
      } = ctx();

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: ctx().client.account.address,
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

      await setBalanceOf(mockToken.address, lockedInvoice.address, 0n);

      await expect(
        mockArbitrator.write.executeRuling([lockedInvoice.address, 1n]),
      ).to.be.revertedWithCustomError(lockedInvoice, 'BalanceIsZero');
    });
  });
}

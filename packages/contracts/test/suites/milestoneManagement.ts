import { expect } from 'chai';
import { getAddress, zeroAddress, zeroHash } from 'viem';

import {
  awaitInvoiceAddress,
  createVariantLockedEscrow,
  currentTimestamp,
  deployEscrow,
  encodeInitData,
  getEscrowAt,
  nextSalt,
  SuiteCtx,
  VariantName,
} from '../helpers';

// eslint-disable-next-line mocha/no-exports
export function milestoneManagementTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Milestone Management', function () {
    it('Should addMilestones if client', async function () {
      const { client, escrow } = ctx();

      const receipt = await escrow.write.addMilestones([[13n, 14n], '']);
      expect((await escrow.read.getAmounts()).length).to.equal(4);
      expect(await escrow.read.amounts([0n])).to.equal(10n);
      expect(await escrow.read.amounts([1n])).to.equal(10n);
      expect(await escrow.read.amounts([2n])).to.equal(13n);
      expect(await escrow.read.amounts([3n])).to.equal(14n);
      await expect(receipt)
        .to.emit(escrow, 'MilestonesAdded')
        .withArgs(getAddress(client.account.address), escrow.address, [
          13n,
          14n,
        ]);
    });

    it('Should addMilestones if provider', async function () {
      const { provider, escrow } = ctx();

      const receipt = await escrow.write.addMilestones([[13n, 14n], ''], {
        account: provider.account,
      });
      expect((await escrow.read.getAmounts()).length).to.equal(4);
      expect(await escrow.read.amounts([0n])).to.equal(10n);
      expect(await escrow.read.amounts([1n])).to.equal(10n);
      expect(await escrow.read.amounts([2n])).to.equal(13n);
      expect(await escrow.read.amounts([3n])).to.equal(14n);
      await expect(receipt)
        .to.emit(escrow, 'MilestonesAdded')
        .withArgs(getAddress(provider.account.address), escrow.address, [
          13n,
          14n,
        ]);
    });

    it('Should addMilestones and update total with added milestones', async function () {
      const { provider, escrow } = ctx();

      await escrow.write.addMilestones([[13n, 14n], ''], {
        account: provider.account,
      });
      expect(await escrow.read.total()).to.equal(47);
    });

    it('Should revert addMilestones if executed by non-client/non-provider', async function () {
      const { randomSigner, escrow } = ctx();

      await expect(
        escrow.write.addMilestones([[13n, 14n], ''], {
          account: randomSigner.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'NotParty');
    });

    it('Should revert addMilestones if locked', async function () {
      const {
        client,
        mockToken,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
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

      await expect(
        lockedInvoice.write.addMilestones([[15n], ''], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'Locked');
    });

    it('Should revert addMilestones after termination', async function () {
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
          requireVerification: false,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await getEscrowAt(variant.contract, tempAddress!);

      await testClient.increaseTime({ seconds: 1000 });

      await expect(
        tempInvoice.write.addMilestones([[15n], ''], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(tempInvoice, 'Terminated');
    });

    it('Should revert addMilestones with empty array', async function () {
      const { client, escrow } = ctx();

      await expect(
        escrow.write.addMilestones([[], ''], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'NoMilestones');
    });

    it('Should revert addMilestones exceeding max limit', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        variant,
        resolverData,
        publicClient,
      } = ctx();

      // First, create an invoice with many milestones (close to limit)
      const manyAmounts = Array(48).fill(BigInt(1)); // 48 milestones
      const currentTime = await currentTimestamp();
      const data = encodeInitData({
        client: client.account.address,
        resolverData,
        token: mockToken.address,
        terminationTime: BigInt(currentTime + 30 * 24 * 60 * 60),
        requireVerification: false,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });

      const hash = await factory.write.createDeterministic([
        getAddress(provider.account.address),
        manyAmounts,
        data,
        variant.typeId,
        0n,
        nextSalt(),
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      // Now try to add 3 more milestones (48 + 3 = 51 > 50 limit)
      await expect(
        tempInvoice.write.addMilestones([[1n, 1n, 1n], ''], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(tempInvoice, 'ExceedsMilestoneLimit');
    });

    it('Should handle milestone limit exactly at MAX_MILESTONE_LIMIT', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        variant,
        resolverData,
        publicClient,
      } = ctx();

      // Create invoice with 49 milestones
      const manyAmounts = Array(49).fill(BigInt(1));
      const currentTime = await currentTimestamp();
      const data = encodeInitData({
        client: client.account.address,
        resolverData,
        token: mockToken.address,
        terminationTime: BigInt(currentTime + 30 * 24 * 60 * 60),
        requireVerification: false,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });

      const hash = await factory.write.createDeterministic([
        getAddress(provider.account.address),
        manyAmounts,
        data,
        variant.typeId,
        0n,
        nextSalt(),
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = await awaitInvoiceAddress(receipt);
      const tempInvoice = await getEscrowAt(variant.contract, address!);

      // Add 1 more milestone to reach exactly 50 (should succeed)
      await tempInvoice.write.addMilestones([[1n], ''], {
        account: client.account,
      });

      expect((await tempInvoice.read.getAmounts()).length).to.equal(50);

      // Try to add one more (should fail as it exceeds limit)
      await expect(
        tempInvoice.write.addMilestones([[1n], ''], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(tempInvoice, 'ExceedsMilestoneLimit');
    });

    it('Should revert init with no milestones', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        variant,
        resolverData,
        escrowImplementation,
      } = ctx();

      await expect(
        deployEscrow(
          variant,
          factory,
          getAddress(provider.account.address),
          [], // Empty amounts array
          {
            client: client.account.address,
            resolverData,
            token: mockToken.address,
            terminationTime: BigInt((await currentTimestamp()) + 3600),
            requireVerification: false,
            providerReceiver: zeroAddress,
            clientReceiver: zeroAddress,
            feeBPS: 0n,
            treasury: zeroAddress,
            details: '',
          },
        ),
      ).to.be.revertedWithCustomError(escrowImplementation, 'NoMilestones');
    });

    it('Should revert init with milestones exceeding limit', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        variant,
        resolverData,
        escrowImplementation,
      } = ctx();

      const tooManyAmounts = Array(51).fill(BigInt(1)); // 51 > 50 limit

      await expect(
        deployEscrow(
          variant,
          factory,
          getAddress(provider.account.address),
          tooManyAmounts,
          {
            client: client.account.address,
            resolverData,
            token: mockToken.address,
            terminationTime: BigInt((await currentTimestamp()) + 3600),
            requireVerification: false,
            providerReceiver: zeroAddress,
            clientReceiver: zeroAddress,
            feeBPS: 0n,
            treasury: zeroAddress,
            details: '',
          },
        ),
      ).to.be.revertedWithCustomError(
        escrowImplementation,
        'ExceedsMilestoneLimit',
      );
    });
  });
}

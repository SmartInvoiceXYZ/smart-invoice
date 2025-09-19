import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import { getAddress, zeroAddress, zeroHash } from 'viem';

import {
  awaitInvoiceAddress,
  createImplementation,
  createVariantLockedEscrow,
  currentTimestamp,
  deployEscrow,
  encodeInitData,
  getEscrowAt,
  nextSalt,
  setBalanceOf,
  SuiteCtx,
  VariantName,
} from '../helpers';

// eslint-disable-next-line mocha/no-exports
export function additionalErrorHandlingAndEdgeCasesTests<
  const V extends VariantName,
>(ctx: () => SuiteCtx<V>) {
  describe('Additional Error Handling and Edge Cases', function () {
    it('Should revert init when called directly', async function () {
      const {
        client,
        provider,
        mockToken,
        resolverData,
        terminationTime,
        amounts,
        escrowImplementation,
      } = ctx();

      const newInvoice = escrowImplementation;

      const data = encodeInitData({
        client: client.account.address,
        resolverData,
        token: mockToken.address,
        terminationTime: BigInt(terminationTime),
        requireVerification: true,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });

      // Try to call init directly (not from factory)
      await expect(
        newInvoice.write.init([
          getAddress(provider.account.address),
          amounts,
          data,
        ]),
      ).to.be.revertedWithCustomError(newInvoice, 'InvalidInitialization');
    });

    it('Should revert with invalid resolution rate bounds', async function () {
      const {
        client,
        provider,
        mockWrappedETH,
        mockSplitsWarehouse,
        mockToken,
        resolverData,
        terminationTime,
        resolver,
        amounts,
        variant,
      } = ctx();

      // Skip this test for variants that don't support resolution
      if (!variant.capabilities.resolvable) {
        this.skip();
      }

      // Mock a factory that returns invalid resolution rate
      const mockFactory = await viem.deployContract('MockFactory');
      const testInvoice = await createImplementation(variant.contract, {
        mockWrappedETH: mockWrappedETH.address,
        factory: mockFactory.address,
        splitsWarehouse: mockSplitsWarehouse.address,
      });

      // Set up mock factory to return resolution rate > 1000
      await mockFactory.write.setResolutionRateBPS([
        resolver.account.address,
        1001n,
      ]);

      const data = encodeInitData({
        client: client.account.address,
        resolverData,
        token: mockToken.address,
        terminationTime: BigInt(terminationTime),
        requireVerification: true,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });

      await expect(
        mockFactory.write.callInit([
          testInvoice.address,
          getAddress(provider.account.address),
          amounts,
          data,
        ]),
      ).to.be.revertedWithCustomError(testInvoice, 'InvalidResolutionRate');
    });

    it('Should revert resolve if not locked', async function () {
      const { escrow, resolver, variant } = ctx();

      // Skip this test for variants that don't support locking/resolving
      if (!variant.capabilities.resolvable) {
        this.skip();
      }

      const resolvableEscrow =
        escrow as unknown as ContractTypesMap['SmartInvoiceEscrow'];

      await expect(
        resolvableEscrow.write.resolve([4500n, zeroHash], {
          account: resolver.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'NotLocked');
    });

    it('Should revert resolve from non-resolver', async function () {
      const {
        client,
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        variant,
      } = ctx();

      // Skip this test for variants that don't support locking/resolving
      if (!variant.capabilities.resolvable) {
        this.skip();
      }

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
      )) as unknown as ContractTypesMap['SmartInvoiceEscrow'];

      await setBalanceOf(mockToken.address, lockedInvoice.address, 100);

      await expect(
        lockedInvoice.write.resolve([4500n, zeroHash], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'NotResolver');
    });

    it('Should revert resolve with zero balance', async function () {
      const {
        resolver,
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        variant,
      } = ctx();

      // Skip this test for variants that don't support locking/resolving
      if (!variant.capabilities.resolvable) {
        this.skip();
      }

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
      )) as unknown as ContractTypesMap['SmartInvoiceEscrow'];

      // Set balance first so ResolutionMismatch check passes, then verify BalanceIsZero check
      await setBalanceOf(mockToken.address, lockedInvoice.address, 20n);
      // Clear balance after setting to trigger BalanceIsZero
      await setBalanceOf(mockToken.address, lockedInvoice.address, 0n);

      await expect(
        lockedInvoice.write.resolve([0n, zeroHash], {
          account: resolver.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'BalanceIsZero');
    });

    it('Should revert lock by non-party', async function () {
      const { escrow, mockToken, randomSigner, variant } = ctx();

      // Skip this test for variants that don't support locking
      if (!variant.capabilities.lock) {
        this.skip();
      }

      await setBalanceOf(mockToken.address, escrow.address, 10);

      await expect(
        escrow.write.lock([zeroHash], {
          account: randomSigner.account,
        }),
      ).to.be.revertedWithCustomError(escrow, 'NotParty');
    });

    it('Should revert lock after termination', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        testClient,
        resolverData,
      } = ctx();

      // Skip this test for variants that don't support locking
      if (!variant.capabilities.lock) {
        this.skip();
      }

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
      const tempInvoice = await getEscrowAt(variant.contract, tempAddress!);

      await setBalanceOf(mockToken.address, tempInvoice.address, 10);
      await testClient.increaseTime({ seconds: 1000 });

      await expect(
        tempInvoice.write.lock([zeroHash], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(tempInvoice, 'Terminated');
    });

    it('Should revert lock if already locked', async function () {
      const {
        client,
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        variant,
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
        lockedInvoice.write.lock([zeroHash], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'Locked');
    });

    it('Should handle arbitrator lock with correct dispute creation', async function () {
      const {
        factory,
        client,
        provider,
        mockArbitrator,
        mockToken,
        amounts,
        variant,
        resolverData,
      } = ctx();

      // Skip this test for variants that don't support arbitration
      if (!variant.capabilities.arbitrable) {
        this.skip();
      }

      // Create a regular escrow first
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
      const tempInvoice = await getEscrowAt(variant.contract, tempAddress!);

      await setBalanceOf(mockToken.address, tempInvoice.address, 10);

      const receipt = await tempInvoice.write.lock(['dispute-uri'], {
        account: client.account,
        value: 10n, // Arbitration cost
      });

      await expect(receipt)
        .to.emit(tempInvoice, 'Dispute')
        .withArgs(getAddress(mockArbitrator.address), 1, 0, 0); // arbitrator, disputeId, metaEvidenceId, evidenceGroupId

      await expect(receipt)
        .to.emit(tempInvoice, 'Lock')
        .withArgs(getAddress(client.account.address), 'dispute-uri');

      expect(await tempInvoice.read.locked()).to.equal(true);
    });

    it('Should handle getAmounts correctly', async function () {
      const { escrow } = ctx();

      const currentAmounts = await escrow.read.getAmounts();
      expect(currentAmounts.length).to.equal(2);
      expect(currentAmounts[0]).to.equal(10n);
      expect(currentAmounts[1]).to.equal(10n);

      // Add milestones and check again
      await escrow.write.addMilestones([[15n, 20n], '']);
      const newAmounts = await escrow.read.getAmounts();
      expect(newAmounts.length).to.equal(4);
      expect(newAmounts[2]).to.equal(15n);
      expect(newAmounts[3]).to.equal(20n);
    });

    it('Should properly emit events during initialization', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        publicClient,
      } = ctx();

      const currentTime = await currentTimestamp();
      const data = encodeInitData({
        client: client.account.address,
        resolverData,
        token: mockToken.address,
        terminationTime: BigInt(currentTime + 3600),
        requireVerification: false, // Auto-verify
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: 'Test invoice details',
      });

      const hash = await factory.write.createDeterministic([
        getAddress(provider.account.address),
        amounts,
        data,
        variant.typeId,
        0n,
        nextSalt(),
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Should emit Verified event during init (requireVerification = false)
      const logs = await publicClient.getLogs({
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      // Should find InvoiceInit, MetaEvidence, and Verified events
      expect(logs.length).to.be.greaterThan(2);
    });

    it('Should emit all events with correct parameters in resolve function', async function () {
      const {
        resolver,
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        variant,
      } = ctx();

      // Skip this test for variants that don't support locking/resolving
      if (!variant.capabilities.resolvable) {
        this.skip();
      }

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
      )) as unknown as ContractTypesMap['SmartInvoiceEscrow'];

      await setBalanceOf(mockToken.address, lockedInvoice.address, 100);
      const resolutionURI = 'ipfs://resolution-details';

      // Balance = 100, resolutionRateBPS = 500, so fee = (100 * 500) / 10000 = 5
      // Client gets 30, provider gets 65, resolver gets 5
      const receipt = await lockedInvoice.write.resolve(
        [3000n, resolutionURI],
        {
          account: resolver.account,
        },
      );

      await expect(receipt).to.emit(lockedInvoice, 'Resolve').withArgs(
        getAddress(resolver.account.address),
        30, // clientAward
        65, // providerAward
        5, // resolutionFee
        resolutionURI,
      );
    });

    it('Should validate Deposit event parameters correctly', async function () {
      const {
        factory,
        client,
        provider,
        mockWrappedETH,
        amounts,
        variant,
        resolverData,
      } = ctx();

      const tx = await deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: client.account.address,
          resolverData,
          token: mockWrappedETH.address, // Use wrapped ETH as main token
          terminationTime: BigInt((await currentTimestamp()) + 3600),
          requireVerification: true,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const tempInvoice = await getEscrowAt(variant.contract, tempAddress!);

      const depositAmount = 25n;
      const receipt = await client.sendTransaction({
        to: tempInvoice.address,
        value: depositAmount,
      });

      await expect(receipt).to.emit(tempInvoice, 'Deposit').withArgs(
        getAddress(client.account.address), // sender
        depositAmount, // amount
        getAddress(mockWrappedETH.address), // token
      );
    });
  });
}

import { expect } from 'chai';
import { ContractTypesMap } from 'hardhat/types';
import { getAddress, parseAbi, parseEventLogs, zeroAddress } from 'viem';

import {
  awaitInvoiceAddress,
  createUnlockSignatures,
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
export function unlockOperationsTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Unlock Operations', function () {
    // Skip all lock and resolve tests for minimal variants that don't have locking
    beforeEach(function () {
      if (!ctx().variant.capabilities.lock) {
        this.skip();
      }
    });

    it('Should unlock with valid signatures - 50/50 split', async function () {
      const {
        client,
        provider,
        mockToken,
        variant,
        clientReceiver,
        providerReceiver,
        mockSplitsWarehouse,
        publicClient,
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
        'test unlock',
      );

      const balance = await getBalanceOf(
        mockToken.address,
        lockedInvoice.address,
      );
      expect(balance).to.equal(10n);

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        5000n, // 50% to client
        'ipfs://unlock-details-50-50',
        [client, provider],
      );

      const clientBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      const hash = await lockedInvoice.write.unlock([
        { refundBPS: 5000n, unlockURI: 'ipfs://unlock-details-50-50' },
        signatures,
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const clientBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      // Verify balance transfers
      expect(clientBalanceAfter).to.equal(clientBalanceBefore + 5n); // 50% of 10
      expect(providerBalanceAfter).to.equal(providerBalanceBefore + 5n); // 50% of 10

      // Verify contract state changes
      expect(await lockedInvoice.read.locked()).to.equal(false);
      expect(await lockedInvoice.read.milestone()).to.equal(2n); // All milestones completed
      expect(await lockedInvoice.read.released()).to.equal(10n);

      // Verify event emission
      const unlockEvents = parseEventLogs({
        abi: parseAbi([
          'event Unlock(address indexed sender, uint256 clientAward, uint256 providerAward, string unlockURI)',
        ]),
        logs: receipt.logs,
      });

      expect(unlockEvents).to.have.length(1);
      const unlockEvent = unlockEvents[0];
      expect(unlockEvent.eventName).to.equal('Unlock');
      expect(unlockEvent.args.sender).to.equal(
        getAddress(client.account.address),
      );
      expect(unlockEvent.args.clientAward).to.equal(5n);
      expect(unlockEvent.args.providerAward).to.equal(5n);
      expect(unlockEvent.args.unlockURI).to.equal(
        'ipfs://unlock-details-50-50',
      );
    });

    it('Should unlock with valid signatures - 70/30 split', async function () {
      const {
        client,
        provider,
        mockToken,
        variant,
        clientReceiver,
        providerReceiver,
        mockSplitsWarehouse,
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
        'test unlock',
      );

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        7000n, // 70% to client
        'ipfs://unlock-details-70-30',
        [client, provider],
      );

      const clientBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      await lockedInvoice.write.unlock([
        { refundBPS: 7000n, unlockURI: 'ipfs://unlock-details-70-30' },
        signatures,
      ]);

      const clientBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      expect(clientBalanceAfter).to.equal(clientBalanceBefore + 7n); // 70% of 10
      expect(providerBalanceAfter).to.equal(providerBalanceBefore + 3n); // 30% of 10
    });

    it('Should unlock with 100% to client', async function () {
      const {
        client,
        provider,
        mockToken,
        variant,
        clientReceiver,
        providerReceiver,
        mockSplitsWarehouse,
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
        'test unlock',
      );

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        10000n, // 100% to client
        'ipfs://full-refund',
        [client, provider],
      );

      const clientBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      await lockedInvoice.write.unlock([
        { refundBPS: 10000n, unlockURI: 'ipfs://full-refund' },
        signatures,
      ]);

      const clientBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      expect(clientBalanceAfter).to.equal(clientBalanceBefore + 10n); // 100% of 10
      expect(providerBalanceAfter).to.equal(providerBalanceBefore + 0n); // 0% of 10
    });

    it('Should unlock with 0% to client (100% to provider)', async function () {
      const {
        client,
        provider,
        mockToken,
        variant,
        clientReceiver,
        providerReceiver,
        mockSplitsWarehouse,
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
        'test unlock',
      );

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        0n, // 0% to client, 100% to provider
        'ipfs://full-provider-award',
        [client, provider],
      );

      const clientBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      await lockedInvoice.write.unlock([
        { refundBPS: 0n, unlockURI: 'ipfs://full-provider-award' },
        signatures,
      ]);

      const clientBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, clientReceiver.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            clientReceiver.account.address,
          );
      const providerBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(
            mockToken.address,
            providerReceiver.account.address,
          )
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            providerReceiver.account.address,
          );

      expect(clientBalanceAfter).to.equal(clientBalanceBefore + 0n); // 0% of 10
      expect(providerBalanceAfter).to.equal(providerBalanceBefore + 10n); // 100% of 10
    });

    it('Should revert unlock if not locked', async function () {
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
          details: 'test details',
        },
      );
      const tempAddress = await awaitInvoiceAddress(tx);

      // Get contract instance for the temp address
      const { getEscrowAt } = await import('../helpers/variants');
      const tempInvoice = (await getEscrowAt(
        variant.contract,
        tempAddress!,
      )) as unknown as ContractTypesMap['SmartInvoiceEscrowCore'];

      const signatures = await createUnlockSignatures(
        tempInvoice,
        5000n,
        'ipfs://should-fail',
        [client, provider],
      );

      await expect(
        tempInvoice.write.unlock([
          { refundBPS: 5000n, unlockURI: 'ipfs://should-fail' },
          signatures,
        ]),
      ).to.be.rejectedWith('NotLocked');
    });

    it('Should revert unlock with zero balance', async function () {
      const {
        client,
        provider,
        mockToken,
        resolverData,
        clientReceiver,
        providerReceiver,
      } = ctx();

      // Create locked escrow but drain the balance
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
        'test unlock',
      );

      // Drain balance to 0
      await setBalanceOf(mockToken.address, lockedInvoice.address, 0n);

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        5000n,
        'ipfs://zero-balance',
        [client, provider],
      );

      await expect(
        lockedInvoice.write.unlock([
          { refundBPS: 5000n, unlockURI: 'ipfs://zero-balance' },
          signatures,
        ]),
      ).to.be.rejectedWith('BalanceIsZero');
    });

    it('Should revert unlock with invalid refundBPS > 10000', async function () {
      const {
        client,
        provider,
        mockToken,
        resolverData,
        clientReceiver,
        providerReceiver,
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
        'test unlock',
      );

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        10001n, // Invalid: > 10000 (100%)
        'ipfs://invalid-refund',
        [client, provider],
      );

      await expect(
        lockedInvoice.write.unlock([
          { refundBPS: 10001n, unlockURI: 'ipfs://invalid-refund' },
          signatures,
        ]),
      ).to.be.rejectedWith('InvalidRefundBPS');
    });

    it('Should revert unlock with invalid signatures', async function () {
      const {
        client,
        resolver,
        randomSigner,
        mockToken,
        resolverData,
        clientReceiver,
        providerReceiver,
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
        'test unlock',
      );

      // Use wrong signers (random instead of client/provider)
      const signatures = await createUnlockSignatures(
        lockedInvoice,
        5000n,
        'ipfs://invalid-sig',
        [randomSigner, resolver], // Wrong signers
      );

      await expect(
        lockedInvoice.write.unlock([
          { refundBPS: 5000n, unlockURI: 'ipfs://invalid-sig' },
          signatures,
        ]),
      ).to.be.rejectedWith('InvalidSignatures');
    });

    it('Should revert unlock with only one signature', async function () {
      const {
        client,
        mockToken,
        resolverData,
        clientReceiver,
        providerReceiver,
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
        'test unlock',
      );

      // Only client signature, missing provider
      const signatures = await createUnlockSignatures(
        lockedInvoice,
        5000n,
        'ipfs://single-sig',
        [client], // Missing provider signature
      );

      await expect(
        lockedInvoice.write.unlock([
          { refundBPS: 5000n, unlockURI: 'ipfs://single-sig' },
          signatures,
        ]),
      ).to.be.rejectedWith('ECDSAInvalidSignature');
    });

    it('Should revert unlock with signatures in wrong order', async function () {
      const {
        client,
        provider,
        mockToken,
        resolverData,
        clientReceiver,
        providerReceiver,
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
        'test unlock',
      );

      // Provider signature first, client second (wrong order)
      const signatures = await createUnlockSignatures(
        lockedInvoice,
        5000n,
        'ipfs://wrong-order',
        [provider, client], // Wrong order: should be [client, provider]
      );

      await expect(
        lockedInvoice.write.unlock([
          { refundBPS: 5000n, unlockURI: 'ipfs://wrong-order' },
          signatures,
        ]),
      ).to.be.rejectedWith('InvalidSignatures');
    });

    it('Should unlock initiated by provider', async function () {
      const {
        client,
        provider,
        mockToken,
        publicClient,
        resolverData,
        clientReceiver,
        providerReceiver,
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
        'test unlock',
      );

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        3000n, // 30% to client
        'ipfs://provider-initiated',
        [client, provider],
      );

      const hash = await lockedInvoice.write.unlock(
        [
          { refundBPS: 3000n, unlockURI: 'ipfs://provider-initiated' },
          signatures,
        ],
        {
          account: provider.account, // Provider initiates the unlock
        },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Verify event shows provider as sender
      const unlockEvents = parseEventLogs({
        abi: parseAbi([
          'event Unlock(address indexed sender, uint256 clientAward, uint256 providerAward, string unlockURI)',
        ]),
        logs: receipt.logs,
      });

      expect(unlockEvents).to.have.length(1);
      const unlockEvent = unlockEvents[0];
      expect(unlockEvent.eventName).to.equal('Unlock');
      expect(unlockEvent.args.sender).to.equal(
        getAddress(provider.account.address),
      );
      expect(unlockEvent.args.clientAward).to.equal(3n);
      expect(unlockEvent.args.providerAward).to.equal(7n);
      expect(unlockEvent.args.unlockURI).to.equal('ipfs://provider-initiated');
    });
  });
}

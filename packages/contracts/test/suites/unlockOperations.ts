import { expect } from 'chai';
import { ContractTypesMap } from 'hardhat/types';
import { getAddress, Hex, parseAbi, parseEventLogs, zeroAddress } from 'viem';

import {
  awaitInvoiceAddress,
  createUnlockHash,
  createUnlockSignatures,
  createVariantLockedEscrow,
  currentTimestamp,
  deployEscrow,
  getBalanceOf,
  getEscrowAt,
  getSplitsBalanceOf,
  setBalanceOf,
  SuiteCtx,
  VariantName,
} from '../helpers';

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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 5000n,
        unlockURI: 'ipfs://unlock-details-50-50',
      };

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
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

      const hash = await lockedInvoice.write.unlock([unlockData, signatures]);
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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 7000n,
        unlockURI: 'ipfs://unlock-details-70-30',
      };

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
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

      await lockedInvoice.write.unlock([unlockData, signatures]);

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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 10000n,
        unlockURI: 'ipfs://full-refund',
      };

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
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

      await lockedInvoice.write.unlock([unlockData, signatures]);

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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 0n,
        unlockURI: 'ipfs://full-provider-award',
      };

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
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

      await lockedInvoice.write.unlock([unlockData, signatures]);

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

      const tempInvoice = (await getEscrowAt(
        variant.contract,
        tempAddress!,
      )) as unknown as ContractTypesMap['SmartInvoiceEscrowCore'];

      const unlockData = {
        milestone: await tempInvoice.read.milestone(),
        refundBPS: 5000n,
        unlockURI: 'ipfs://should-fail',
      };

      const signatures = await createUnlockSignatures(tempInvoice, unlockData, [
        client,
        provider,
      ]);

      await expect(
        tempInvoice.write.unlock([unlockData, signatures]),
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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 5000n,
        unlockURI: 'ipfs://zero-balance',
      };

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
        [client, provider],
      );

      await expect(
        lockedInvoice.write.unlock([unlockData, signatures]),
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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 10001n, // Invalid: > 10000 (100%)
        unlockURI: 'ipfs://invalid-refund',
      };

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
        [client, provider],
      );

      await expect(
        lockedInvoice.write.unlock([unlockData, signatures]),
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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 5000n,
        unlockURI: 'ipfs://invalid-sig',
      };

      // Use wrong signers (random instead of client/provider)
      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
        [randomSigner, resolver], // Wrong signers
      );

      await expect(
        lockedInvoice.write.unlock([unlockData, signatures]),
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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 5000n,
        unlockURI: 'ipfs://single-sig',
      };

      // Only client signature, missing provider
      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
        [client], // Missing provider signature
      );

      await expect(
        lockedInvoice.write.unlock([unlockData, signatures]),
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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 5000n,
        unlockURI: 'ipfs://wrong-order',
      };

      // Provider signature first, client second (wrong order)
      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
        [provider, client], // Wrong order: should be [client, provider]
      );

      await expect(
        lockedInvoice.write.unlock([unlockData, signatures]),
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

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 3000n,
        unlockURI: 'ipfs://provider-initiated',
      };

      const signatures = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
        [client, provider],
      );

      const hash = await lockedInvoice.write.unlock([unlockData, signatures], {
        account: provider.account, // Provider initiates the unlock
      });

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

    it('Should unlock with client approveHash and provider signature', async function () {
      const {
        variant,
        client,
        provider,
        mockToken,
        publicClient,
        resolverData,
        mockSplitsWarehouse,
      } = ctx();

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(await currentTimestamp()) + 1000n,
          requireVerification: false,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
        'test unlock',
      );

      // Get the hash that would be used for unlock
      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 5000n,
        unlockURI: 'ipfs://approve-hash-test',
      };

      // Compute the EIP712 hash using our utility to get the hash
      const eip712Hash = await createUnlockHash(lockedInvoice, unlockData);

      // Client approves the hash on-chain instead of signing
      await lockedInvoice.write.approveHash([eip712Hash], {
        account: client.account,
      });

      // Provider signs normally
      const providerSignature = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
        [provider],
      );

      // Create combined signatures: empty client sig (65 bytes of zeros) + provider sig
      const emptySignature = `0x${'00'.repeat(65)}`; // 65 bytes of zeros for empty signature
      const combinedSignatures = (emptySignature +
        providerSignature.slice(2)) as Hex;

      const clientBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, client.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            client.account.address,
          );
      const providerBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, provider.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            provider.account.address,
          );

      // Should unlock successfully with approved hash + signature
      const hash = await lockedInvoice.write.unlock([
        unlockData,
        combinedSignatures,
      ]);
      await publicClient.waitForTransactionReceipt({ hash });

      const clientBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, client.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            client.account.address,
          );
      const providerBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, provider.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            provider.account.address,
          );

      // Verify balance transfers (50/50 split)
      expect(clientBalanceAfter).to.equal(clientBalanceBefore + 5n);
      expect(providerBalanceAfter).to.equal(providerBalanceBefore + 5n);
    });

    it('Should unlock with provider approveHash and client signature', async function () {
      const {
        variant,
        client,
        provider,
        mockToken,
        publicClient,
        resolverData,
        mockSplitsWarehouse,
      } = ctx();

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(await currentTimestamp()) + 1000n,
          requireVerification: false,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
        'test unlock',
      );

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 7000n, // 70% to client
        unlockURI: 'ipfs://provider-approve-hash',
      };

      // Get the EIP712 hash
      const eip712Hash = await createUnlockHash(lockedInvoice, unlockData);

      // Provider approves the hash on-chain
      await lockedInvoice.write.approveHash([eip712Hash], {
        account: provider.account,
      });

      // Client signs normally
      const clientSignature = await createUnlockSignatures(
        lockedInvoice,
        unlockData,
        [client],
      );

      // Create combined signatures: client sig + empty provider sig
      const emptySignature = `0x${'00'.repeat(65)}`; // 65 bytes of zeros for empty signature
      const combinedSignatures = (clientSignature +
        emptySignature.slice(2)) as Hex;

      const clientBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, client.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            client.account.address,
          );
      const providerBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, provider.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            provider.account.address,
          );

      // Should unlock successfully with approved hash + signature
      const hash = await lockedInvoice.write.unlock([
        unlockData,
        combinedSignatures,
      ]);
      await publicClient.waitForTransactionReceipt({ hash });

      const clientBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, client.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            client.account.address,
          );
      const providerBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, provider.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            provider.account.address,
          );

      // Verify balance transfers (70/30 split)
      expect(clientBalanceAfter).to.equal(clientBalanceBefore + 7n);
      expect(providerBalanceAfter).to.equal(providerBalanceBefore + 3n);
    });

    it('Should unlock with both client and provider approveHash', async function () {
      const {
        variant,
        client,
        provider,
        mockToken,
        publicClient,
        resolverData,
        mockSplitsWarehouse,
      } = ctx();

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(await currentTimestamp()) + 1000n,
          requireVerification: false,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
        'test unlock',
      );

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 9000n, // 90% to client
        unlockURI: 'ipfs://both-approve-hash',
      };

      // Get the EIP712 hash
      const eip712Hash = await createUnlockHash(lockedInvoice, unlockData);

      // Both parties approve the hash on-chain
      await lockedInvoice.write.approveHash([eip712Hash], {
        account: client.account,
      });
      await lockedInvoice.write.approveHash([eip712Hash], {
        account: provider.account,
      });

      // Use empty signatures for both (since both are approved)
      const combinedSignatures: Hex = `0x${'00'.repeat(130)}`; // 65 bytes of zeros per empty signature

      const clientBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, client.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            client.account.address,
          );
      const providerBalanceBefore = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, provider.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            provider.account.address,
          );

      // Should unlock successfully with approved hash + signature
      const hash = await lockedInvoice.write.unlock([
        unlockData,
        combinedSignatures,
      ]);
      await publicClient.waitForTransactionReceipt({ hash });

      const clientBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, client.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            client.account.address,
          );
      const providerBalanceAfter = variant.capabilities.push
        ? await getBalanceOf(mockToken.address, provider.account.address)
        : await getSplitsBalanceOf(
            mockSplitsWarehouse,
            mockToken.address,
            provider.account.address,
          );

      // Verify balance transfers (90/10 split)
      expect(clientBalanceAfter).to.equal(clientBalanceBefore + 9n);
      expect(providerBalanceAfter).to.equal(providerBalanceBefore + 1n);
    });

    it('Should emit ApproveHash event when hash is approved', async function () {
      const { client, mockToken, publicClient, resolverData } = ctx();

      const lockedInvoice = await createVariantLockedEscrow(
        ctx(),
        {
          client: client.account.address,
          resolverData,
          token: mockToken.address,
          terminationTime: BigInt(await currentTimestamp()) + 1000n,
          requireVerification: false,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
        'test unlock',
      );

      const unlockData = {
        milestone: await lockedInvoice.read.milestone(),
        refundBPS: 5000n,
        unlockURI: 'ipfs://approve-hash-event-test',
      };

      // Get the EIP712 hash
      const eip712Hash = await createUnlockHash(lockedInvoice, unlockData);

      // Approve the hash and check for event
      const hash = await lockedInvoice.write.approveHash([eip712Hash], {
        account: client.account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Check for ApproveHash event
      const events = parseEventLogs({
        abi: parseAbi([
          'event ApproveHash(bytes32 indexed hash, address indexed owner)',
        ]),
        logs: receipt.logs,
      });

      const approveHashEvent = events.find(e => e.eventName === 'ApproveHash');
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(approveHashEvent).to.not.be.undefined;
      expect(approveHashEvent?.args.hash).to.equal(eip712Hash);
      expect(approveHashEvent?.args.owner).to.equal(
        getAddress(client.account.address),
      );
    });
  });
}

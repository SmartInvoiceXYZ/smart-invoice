import { expect } from 'chai';
import { ContractTypesMap } from 'hardhat/types';
import { getAddress, zeroAddress, zeroHash } from 'viem';

import {
  awaitInvoiceAddress,
  createVariantLockedEscrow,
  currentTimestamp,
  deployEscrow,
  getEscrowAt,
  setBalanceOf,
  SuiteCtx,
  VariantName,
} from '../helpers';

// eslint-disable-next-line mocha/no-exports
export function evidenceAndAppealOperationsTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Evidence and Appeal Operations', function () {
    // Skip all evidence and appeal tests for non-arbitrable variants
    beforeEach(function () {
      if (!ctx().variant.capabilities.arbitrable) {
        this.skip();
      }
    });

    it('Should allow client to submit evidence', async function () {
      const {
        client,
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
        mockArbitrator,
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

      const evidenceURI = 'ipfs://evidence-hash';
      const receipt = await lockedInvoice.write.submitEvidence(
        [0n, evidenceURI],
        {
          account: client.account,
        },
      );

      await expect(receipt).to.emit(lockedInvoice, 'Evidence').withArgs(
        getAddress(mockArbitrator.address),
        0n, // evidenceGroupId
        getAddress(client.account.address),
        evidenceURI,
      );
    });

    it('Should allow provider to submit evidence', async function () {
      const {
        provider,
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

      const evidenceURI = 'ipfs://provider-evidence';
      const receipt = await lockedInvoice.write.submitEvidence(
        [0n, evidenceURI],
        {
          account: provider.account,
        },
      );

      await expect(receipt).to.emit(lockedInvoice, 'Evidence').withArgs(
        getAddress(mockArbitrator.address),
        0n, // evidenceGroupId
        getAddress(provider.account.address),
        evidenceURI,
      );
    });

    it('Should revert evidence submission by non-party', async function () {
      const {
        randomSigner,
        mockToken,
        resolverData,
        providerReceiver,
        clientReceiver,
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

      await expect(
        lockedInvoice.write.submitEvidence([0n, 'ipfs://evidence'], {
          account: randomSigner.account,
        }),
      ).to.be.revertedWithCustomError(lockedInvoice, 'NotParty');
    });

    it('Should revert evidence submission if not locked', async function () {
      const {
        factory,
        client,
        provider,
        mockToken,
        amounts,
        variant,
        resolverData,
        providerReceiver,
        clientReceiver,
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
          terminationTime: BigInt(currentTime) + 3600n,
          requireVerification: false,
          providerReceiver: getAddress(providerReceiver.account.address),
          clientReceiver: getAddress(clientReceiver.account.address),
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );
      const tempAddress = await awaitInvoiceAddress(tx);
      const regularInvoice = (await getEscrowAt(
        variant.contract,
        tempAddress!,
      )) as unknown as ContractTypesMap['SmartInvoiceEscrowArbitrable'];

      await setBalanceOf(mockToken.address, regularInvoice.address, 10n);

      await expect(
        regularInvoice.write.submitEvidence([0n, 'ipfs://evidence'], {
          account: client.account,
        }),
      ).to.be.revertedWithCustomError(regularInvoice, 'NotLocked');
    });
  });
}

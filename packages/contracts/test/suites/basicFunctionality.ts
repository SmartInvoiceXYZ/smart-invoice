import { expect } from 'chai';
import { ContractTypesMap } from 'hardhat/types';
import { encodeAbiParameters, getAddress, zeroAddress, zeroHash } from 'viem';

import {
  awaitInvoiceAddress,
  createImplementation,
  currentTimestamp,
  deployEscrow,
  encodeInitData,
  getEscrowAt,
  nextSalt,
} from '../helpers';
import { SuiteCtx, VariantName } from '../helpers/variants';

// eslint-disable-next-line mocha/no-exports
export function basicFunctionalityTests<const V extends VariantName>(
  ctx: () => SuiteCtx<V>,
) {
  describe('Basic Functionality', function () {
    it('Should deploy a SmartInvoice', async function () {
      const {
        escrow,
        client,
        clientReceiver,
        provider,
        providerReceiver,
        resolver,
        mockToken,
        amounts,
        terminationTime,
        resolutionRateBps,
        total,
        mockWrappedETH,
      } = ctx();

      expect(await escrow.read.client()).to.equal(
        getAddress(client.account.address),
      );
      expect(await escrow.read.provider()).to.equal(
        getAddress(provider.account.address),
      );

      if (ctx().variant.capabilities.resolvable) {
        const resolvableEscrow =
          escrow as ContractTypesMap['SmartInvoiceEscrowPush'];
        expect(await resolvableEscrow.read.resolver()).to.equal(
          getAddress(resolver.account.address),
        );
        expect(await resolvableEscrow.read.resolutionRateBPS()).to.equal(
          resolutionRateBps,
        );
      } else if (ctx().variant.capabilities.arbitrable) {
        const arbitrableEscrow =
          escrow as ContractTypesMap['SmartInvoiceEscrowArbitrablePush'];
        // For arbitrable variants, resolver field contains the arbitrator address
        expect(await arbitrableEscrow.read.resolver()).to.equal(
          getAddress(ctx().mockArbitrator.address),
        );
        expect(await arbitrableEscrow.read.metaEvidenceId()).to.equal(0n);
        expect(await arbitrableEscrow.read.arbitratorExtraData()).to.equal(
          `${zeroHash}${zeroHash.slice(2)}`,
        );
      }

      expect(await escrow.read.token()).to.equal(getAddress(mockToken.address));

      for (let i = 0; i < amounts.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        expect(await escrow.read.amounts([BigInt(i)])).to.equal(amounts[i]);
      }
      expect(await escrow.read.terminationTime()).to.equal(
        BigInt(terminationTime),
      );

      expect(await escrow.read.milestone()).to.equal(0n);
      expect(await escrow.read.total()).to.equal(total);

      expect(await escrow.read.locked()).to.equal(false);

      expect(await escrow.read.WRAPPED_ETH()).to.equal(
        getAddress(mockWrappedETH.address),
      );
      expect(await escrow.read.providerReceiver()).to.equal(
        getAddress(providerReceiver.account.address),
      );
      expect(await escrow.read.clientReceiver()).to.equal(
        getAddress(clientReceiver.account.address),
      );
    });

    it('Should emit InvoiceInit event during deployment', async function () {
      const {
        factory,
        client,
        provider,
        resolverData,
        mockToken,
        terminationTime,
        requireVerification,
        amounts,
        publicClient,
        variant,
      } = ctx();

      const data = encodeInitData({
        client: client.account.address,
        resolverData,
        token: mockToken.address,
        terminationTime: BigInt(terminationTime),
        requireVerification,
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
      const address = await awaitInvoiceAddress(receipt);
      const newInvoice = await getEscrowAt(variant.contract, address!);

      await expect(hash)
        .to.emit(newInvoice, 'InvoiceInit')
        .withArgs(
          getAddress(provider.account.address),
          getAddress(client.account.address),
          amounts,
          'Test invoice details',
        );

      // Verify the invoice was created properly
      expect(await newInvoice.read.client()).to.equal(
        getAddress(client.account.address),
      );
      expect(await newInvoice.read.provider()).to.equal(
        getAddress(provider.account.address),
      );
    });

    it('Should emit Verified event when requireVerification is false', async function () {
      const {
        factory,
        client,
        provider,
        resolverData,
        mockToken,
        terminationTime,
        amounts,
        publicClient,
        variant,
      } = ctx();

      const data = encodeInitData({
        client: client.account.address,
        resolverData,
        token: mockToken.address,
        terminationTime: BigInt(terminationTime),
        requireVerification: false, // Auto-verify
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
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
      const address = await awaitInvoiceAddress(receipt);

      const newInvoice = await getEscrowAt(variant.contract, address!);

      await expect(hash)
        .to.emit(newInvoice, 'InvoiceInit')
        .withArgs(
          getAddress(provider.account.address),
          getAddress(client.account.address),
          amounts,
          '',
        );
      await expect(hash)
        .to.emit(newInvoice, 'Verified')
        .withArgs(getAddress(client.account.address), getAddress(address!));
    });

    it('Should revert init if implementation', async function () {
      const {
        client,
        resolver,
        mockToken,
        mockWrappedETH,
        factory,
        variant,
        requireVerification,
        provider,
        amounts,
      } = ctx();

      const currentTime = await currentTimestamp();
      const newInvoice = await createImplementation(variant.contract, {
        mockWrappedETH: mockWrappedETH.address,
        factory,
      });

      const data = encodeAbiParameters(
        [
          'address',
          'address',
          'address',
          'uint256',
          'bytes32',
          'address',
          'bool',
        ].map(v => ({ type: v })),
        [
          getAddress(client.account.address),
          getAddress(resolver.account.address),
          mockToken.address,
          BigInt(currentTime - 3600),
          zeroHash,
          mockWrappedETH.address,
          requireVerification,
        ],
      );

      const receipt = newInvoice.write.init([
        getAddress(provider.account.address),
        amounts,
        data,
      ]);
      await expect(receipt).to.be.revertedWithCustomError(
        newInvoice,
        'InvalidInitialization',
      );
    });

    it('Should revert init if invalid client', async function () {
      const {
        factory,
        escrowImplementation,
        provider,
        mockToken,
        amounts,
        requireVerification,
        variant,
      } = ctx();

      const currentTime = await currentTimestamp();
      const receipt = deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: zeroAddress,
          resolverData: zeroHash,
          token: mockToken.address,
          terminationTime: BigInt(currentTime - 3600),
          requireVerification,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );
      await expect(receipt).to.be.revertedWithCustomError(
        escrowImplementation,
        'InvalidClient',
      );
    });

    it('Should revert init if invalid provider', async function () {
      const {
        factory,
        escrowImplementation,
        client,
        mockToken,
        amounts,
        requireVerification,
        variant,
      } = ctx();

      const currentTime = await currentTimestamp();
      const receipt = deployEscrow(variant, factory, zeroAddress, amounts, {
        client: getAddress(client.account.address),
        resolverData: zeroHash,
        token: mockToken.address,
        terminationTime: BigInt(currentTime),
        requireVerification,
        providerReceiver: zeroAddress,
        clientReceiver: zeroAddress,
        feeBPS: 0n,
        treasury: zeroAddress,
        details: '',
      });
      await expect(receipt).to.be.revertedWithCustomError(
        escrowImplementation,
        'InvalidProvider',
      );
    });

    it('Should revert init if invalid resolver', async function () {
      const {
        factory,
        escrowImplementation,
        client,
        provider,
        mockToken,
        amounts,
        requireVerification,
        variant,
      } = ctx();

      const currentTime = await currentTimestamp();
      const receipt = deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: getAddress(client.account.address),
          resolverData: zeroHash,
          token: mockToken.address,
          terminationTime: BigInt(currentTime + 3600),
          requireVerification,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );

      await expect(receipt).to.be.revertedWithCustomError(
        escrowImplementation,
        'InvalidResolverData',
      );
    });

    it('Should revert init if invalid token', async function () {
      const {
        factory,
        escrowImplementation,
        client,
        provider,
        amounts,
        requireVerification,
        variant,
      } = ctx();

      const currentTime = await currentTimestamp();
      const receipt = deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: getAddress(client.account.address),
          resolverData: zeroHash,
          token: zeroAddress,
          terminationTime: BigInt(currentTime - 3600),
          requireVerification,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );
      await expect(receipt).to.be.revertedWithCustomError(
        escrowImplementation,
        'InvalidToken',
      );
    });

    it('Should revert init if terminationTime has ended', async function () {
      const {
        factory,
        escrowImplementation,
        client,
        provider,
        mockToken,
        amounts,
        requireVerification,
        variant,
      } = ctx();

      const currentTime = await currentTimestamp();
      const receipt = deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: getAddress(client.account.address),
          resolverData: zeroHash,
          token: mockToken.address,
          terminationTime: BigInt(currentTime - 3600),
          requireVerification,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );

      await expect(receipt).to.be.revertedWithCustomError(
        escrowImplementation,
        'DurationEnded',
      );
    });

    it('Should revert init if terminationTime too long', async function () {
      const {
        factory,
        escrowImplementation,
        client,
        provider,
        mockToken,
        amounts,
        requireVerification,
        variant,
      } = ctx();

      const currentTime = await currentTimestamp();
      const receipt = deployEscrow(
        variant,
        factory,
        getAddress(provider.account.address),
        amounts,
        {
          client: getAddress(client.account.address),
          resolverData: zeroHash,
          token: mockToken.address,
          terminationTime: BigInt(currentTime + 5 * 365 * 24 * 3600),
          requireVerification,
          providerReceiver: zeroAddress,
          clientReceiver: zeroAddress,
          feeBPS: 0n,
          treasury: zeroAddress,
          details: '',
        },
      );
      await expect(receipt).to.be.revertedWithCustomError(
        escrowImplementation,
        'DurationTooLong',
      );
    });
  });
}

import {
  PublicClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types';
import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import {
  encodeAbiParameters,
  getAddress,
  Hex,
  toBytes,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem';

import { awaitInvoiceAddress } from './utils';

const resolverType = 0;
const amounts = [BigInt(10), BigInt(10)];
const total = amounts.reduce((t, v) => t + v, BigInt(0));
const terminationTime =
  Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60;
const requireVerification = true;
const escrowType = toHex(toBytes('escrow', { size: 32 }));

describe('SmartInvoiceFactory', function() {
  let escrow: ContractTypesMap['SmartInvoiceEscrow'];
  let invoiceFactory: ContractTypesMap['SmartInvoiceFactory'];
  let publicClient: PublicClient;
  let owner: WalletClient;
  let addr1: WalletClient;
  let addr2: WalletClient;
  let token: Hex;
  let wrappedNativeToken: Hex;

  let invoiceAddress: Hex;
  let client: Hex;
  let provider: Hex;
  let resolver: Hex;

  let data: Hex;
  let escrowData: [Hex, number, Hex, Hex, bigint, Hex, Hex, boolean, Hex, Hex, Hex];

  beforeEach(async function() {
    const walletClients = await viem.getWalletClients();
    [owner, addr1, addr2] = walletClients;
    publicClient = await viem.getPublicClient();
    client = getAddress(owner.account.address);
    provider = getAddress(addr1.account.address);
    resolver = getAddress(addr2.account.address);

    const mockTokenContract = await viem.deployContract('MockToken');
    token = getAddress(mockTokenContract.address);

    const mockWrappedToken = await viem.deployContract('MockWETH');
    wrappedNativeToken = getAddress(mockWrappedToken.address);

    const details = zeroHash;

    escrow = await viem.deployContract('SmartInvoiceEscrow');
    invoiceFactory = await viem.deployContract('SmartInvoiceFactory', [
      wrappedNativeToken,
    ]);

    escrowData = [
      client,
      resolverType,
      resolver,
      token,
      BigInt(terminationTime), // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      requireVerification,
      invoiceFactory.address,
      zeroAddress, // no providerReceiver
      zeroAddress, // no clientReceiver
    ];
  });

  it('Should deploy with 0 invoiceCount', async function() {
    const invoiceCount = await invoiceFactory.read.invoiceCount();
    expect(invoiceCount).to.equal(0n);
  });

  it('Should revert deploy if zero wrappedNativeToken', async function() {
    const hash = viem.deployContract('SmartInvoiceFactory', [zeroAddress]);
    await expect(hash).to.be.revertedWithCustomError(
      invoiceFactory,
      'InvalidWrappedNativeToken',
    );
  });

  it('Should deploy and set DEFAULT_ADMIN and ADMIN roles as msg.sender', async function() {
    const deployer = client;
    const adminRole = await invoiceFactory.read.hasRole([
      await invoiceFactory.read.ADMIN(),
      deployer,
    ]);
    const defaultAdminRole = await invoiceFactory.read.hasRole([
      await invoiceFactory.read.DEFAULT_ADMIN_ROLE(),
      deployer,
    ]);
    expect(adminRole).to.equal(true);
    expect(defaultAdminRole).to.equal(true);
  });

  it('Should addImplementation as an admin', async function() {
    await expect(
      invoiceFactory.write.addImplementation([escrowType, escrow.address]),
    ).not.to.be.reverted;
  });

  it('Should addImplementation and emit AddImplementation event', async function() {
    const implementation = getAddress(escrow.address);
    const version = 0;
    const receipt = invoiceFactory.write.addImplementation([
      escrowType,
      implementation,
    ]);
    expect(receipt)
      .to.emit(invoiceFactory, 'AddImplementation')
      .withArgs(escrowType, version, implementation);
  });

  it('Implementation getter should return correct implementation', async function() {
    const implementation = getAddress(escrow.address);
    await invoiceFactory.write.addImplementation([escrowType, implementation]);
    expect(
      await invoiceFactory.read.getImplementation([escrowType, 0n]),
    ).to.be.equal(implementation);
  });

  it('Should revert addImplementation if non-admin', async function() {
    const implementation = escrow.address;
    const receipt = invoiceFactory.write.addImplementation(
      [escrowType, implementation],
      {
        account: addr1.account,
      },
    );
    await expect(receipt).to.be.reverted;
  });

  it('Should deploy a SmartInvoiceEscrow', async function() {
    await invoiceFactory.write.addImplementation([escrowType, escrow.address]);
    const version = await invoiceFactory.read.currentVersions([escrowType]);
    data = encodeAbiParameters(
      [
        'address',
        'uint8',
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'bool',
        'address',
        'address',
        'address',
      ].map(v => ({ type: v })),
      escrowData,
    );

    const hash = await invoiceFactory.write.create([
      provider,
      amounts,
      data,
      escrowType,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const address = await awaitInvoiceAddress(receipt);
    expect(address).to.not.equal(undefined);
    invoiceAddress = address!;

    await expect(hash)
      .to.emit(invoiceFactory, 'LogNewInvoice')
      .withArgs(0, invoiceAddress, amounts, escrowType, version);

    const invoice = await viem.getContractAt(
      'SmartInvoiceEscrow',
      invoiceAddress,
    );
    expect(await invoice.read.client()).to.equal(client);
    expect(await invoice.read.provider()).to.equal(provider);
    expect(await invoice.read.resolverType()).to.equal(resolverType);
    expect(await invoice.read.resolver()).to.equal(resolver);
    expect(await invoice.read.token()).to.equal(token);

    for (let i = 0; i < amounts.length; i += 1) {
      const v = BigInt(amounts[i]);
      // eslint-disable-next-line no-await-in-loop
      expect(await invoice.read.amounts([BigInt(i)])).to.equal(v);
    }

    expect(await invoice.read.terminationTime()).to.equal(terminationTime);
    expect(await invoice.read.details()).to.equal(zeroHash);
    expect(await invoice.read.resolutionRate()).to.equal(20);
    expect(await invoice.read.milestone()).to.equal(0);
    expect(await invoice.read.total()).to.equal(total);
    expect(await invoice.read.locked()).to.equal(false);
    expect(await invoice.read.disputeId()).to.equal(0);
    expect(await invoice.read.wrappedNativeToken()).to.equal(
      wrappedNativeToken,
    );
    expect(await invoiceFactory.read.getInvoiceAddress([0n])).to.equal(
      invoiceAddress,
    );
  });

  it('Should revert create if no implementation of _type', async function() {
    const fakeType = toHex(toBytes('fake', { size: 32 }));
    data = encodeAbiParameters([{ type: 'string' }], ['']);
    const txHash = invoiceFactory.write.create([
      provider,
      amounts,
      '0x',
      fakeType,
    ]);
    await expect(txHash).to.be.revertedWithCustomError(
      invoiceFactory,
      'ImplementationDoesNotExist',
    );
  });

  it('Should predict SmartInvoice address', async function() {
    await invoiceFactory.write.addImplementation([escrowType, escrow.address]);
    const version = await invoiceFactory.read.currentVersions([escrowType]);
    data = encodeAbiParameters(
      [
        'address',
        'uint8',
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'bool',
        'address',
        'address',
        'address',
      ].map(v => ({ type: v })),
      escrowData,
    );

    const predictedAddress =
      await invoiceFactory.read.predictDeterministicAddress([
        escrowType,
        zeroHash,
      ]);
    const hash = await invoiceFactory.write.createDeterministic([
      provider,
      amounts,
      data,
      escrowType,
      zeroHash,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const address = await awaitInvoiceAddress(receipt);
    expect(address).to.not.equal(undefined);
    invoiceAddress = address!;

    await expect(hash)
      .to.emit(invoiceFactory, 'LogNewInvoice')
      .withArgs(0, invoiceAddress, amounts, escrowType, version);

    expect(invoiceAddress).to.equal(predictedAddress);
    expect(await invoiceFactory.read.getInvoiceAddress([0n])).to.equal(
      invoiceAddress,
    );
  });

  it('Should update resolutionRate', async function() {
    let resolutionRate = await invoiceFactory.read.resolutionRates([
      addr2.account.address,
    ]);
    expect(resolutionRate).to.equal(0);

    const txHash = await invoiceFactory.write.updateResolutionRate(
      [10n, zeroHash],
      { account: addr2.account },
    );
    await expect(txHash)
      .to.emit(invoiceFactory, 'UpdateResolutionRate')
      .withArgs(getAddress(addr2.account.address), 10, zeroHash);

    resolutionRate = await invoiceFactory.read.resolutionRates([
      addr2.account.address,
    ]);
    expect(resolutionRate).to.equal(10n);
  });

  it('Should deploy with new resolutionRate', async function() {
    await invoiceFactory.write.addImplementation([escrowType, escrow.address]);
    const version = 0;

    data = encodeAbiParameters(
      [
        'address',
        'uint8',
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'bool',
        'address',
        'address',
        'address',
      ].map(v => ({ type: v })),
      escrowData,
    );

    await invoiceFactory.write.updateResolutionRate([10n, zeroHash], {
      account: addr2.account,
    });
    const hash = await invoiceFactory.write.create([
      provider,
      amounts,
      data,
      escrowType,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const address = await awaitInvoiceAddress(receipt);
    expect(address).to.not.equal(undefined);
    invoiceAddress = address!;

    await expect(hash)
      .to.emit(invoiceFactory, 'LogNewInvoice')
      .withArgs(0, invoiceAddress, amounts, escrowType, version);

    const invoice = await viem.getContractAt(
      'SmartInvoiceEscrow',
      invoiceAddress,
    );
    expect(await invoice.read.resolutionRate()).to.equal(10n);
    expect(await invoiceFactory.read.getInvoiceAddress([0n])).to.equal(
      invoiceAddress,
    );
  });

  it('Should update invoiceCount', async function() {
    await invoiceFactory.write.addImplementation([escrowType, escrow.address]);

    data = encodeAbiParameters(
      [
        'address',
        'uint8',
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'bool',
        'address',
        'address',
        'address',
      ].map(v => ({ type: v })),
      escrowData,
    );

    expect(await invoiceFactory.read.invoiceCount()).to.equal(0n);
    let hash = await invoiceFactory.write.create([
      provider,
      amounts,
      data,
      escrowType,
    ]);
    let receipt = await publicClient.waitForTransactionReceipt({ hash });
    const invoice0 = await awaitInvoiceAddress(receipt);
    expect(await invoiceFactory.read.invoiceCount()).to.equal(1n);

    hash = await invoiceFactory.write.create([
      provider,
      amounts,
      data,
      escrowType,
    ]);
    receipt = await publicClient.waitForTransactionReceipt({ hash });
    const invoice1 = await awaitInvoiceAddress(receipt);
    expect(await invoiceFactory.read.invoiceCount()).to.equal(2n);

    expect(await invoiceFactory.read.getInvoiceAddress([0n])).to.equal(
      invoice0,
    );
    expect(await invoiceFactory.read.getInvoiceAddress([1n])).to.equal(
      invoice1,
    );
  });
});

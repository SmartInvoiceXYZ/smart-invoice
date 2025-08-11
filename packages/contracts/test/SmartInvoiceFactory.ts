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
  keccak256,
  toBytes,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem';

import { awaitInvoiceAddress, currentTimestamp, encodeInitData } from './utils';

const resolverType = 0;
const amounts = [BigInt(10), BigInt(10)];
const total = amounts.reduce((t, v) => t + v, BigInt(0));
let terminationTime =
  Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60;
const requireVerification = true;
const escrowType = keccak256(toBytes('escrow-v3'));

describe('SmartInvoiceFactory', function () {
  let escrow: ContractTypesMap['SmartInvoiceEscrow'];
  let invoiceFactory: ContractTypesMap['SmartInvoiceFactory'];
  let publicClient: PublicClient;
  let owner: WalletClient;
  let client: WalletClient;
  let clientReceiver: WalletClient;
  let resolver: WalletClient;
  let provider: WalletClient;
  let providerReceiver: WalletClient;
  let token: Hex;
  let wrappedNativeToken: Hex;
  let milestoneAmounts: bigint[];

  let tokenContract: ContractTypesMap['MockToken'];
  let wrappedNativeTokenContract: ContractTypesMap['MockWETH'];

  let invoiceAddress: Hex;

  let data: Hex;
  let escrowInitData: {
    client: Hex;
    resolverType: number;
    resolver: Hex;
    token: Hex;
    terminationTime: bigint;
    requireVerification: boolean;
    providerReceiver: Hex;
    clientReceiver: Hex;
    feeBPS: bigint;
    treasury: Hex;
    details: string;
  };

  beforeEach(async function () {
    [owner, client, clientReceiver, resolver, provider, providerReceiver] =
      await viem.getWalletClients();
    publicClient = await viem.getPublicClient();

    const mockTokenContract = await viem.deployContract('MockToken');
    token = getAddress(mockTokenContract.address);
    tokenContract = mockTokenContract;

    const mockWrappedToken = await viem.deployContract('MockWETH');
    wrappedNativeToken = getAddress(mockWrappedToken.address);
    wrappedNativeTokenContract = mockWrappedToken;

    invoiceFactory = await viem.deployContract('SmartInvoiceFactory', [
      wrappedNativeToken,
    ]);
    escrow = await viem.deployContract('SmartInvoiceEscrow', [
      wrappedNativeToken,
      invoiceFactory.address,
    ]);

    terminationTime = (await currentTimestamp()) + 30 * 24 * 60 * 60;

    escrowInitData = {
      client: getAddress(client.account.address),
      resolverType,
      resolver: getAddress(resolver.account.address),
      token,
      terminationTime: BigInt(terminationTime),
      requireVerification,
      providerReceiver: getAddress(providerReceiver.account.address),
      clientReceiver: getAddress(clientReceiver.account.address),
      feeBPS: 0n, // no fees
      treasury: zeroAddress, // no treasury needed when feeBPS is 0
      details: '',
    };

    milestoneAmounts = [
      BigInt(10) * BigInt(10) ** BigInt(18), // 10 MTK
      BigInt(10) * BigInt(10) ** BigInt(18), // 10 MTK
    ];
  });

  it('Should deploy with 0 invoiceCount', async function () {
    const invoiceCount = await invoiceFactory.read.invoiceCount();
    expect(invoiceCount).to.equal(0n);
  });

  it('Should revert deploy if zero wrappedNativeToken', async function () {
    const hash = viem.deployContract('SmartInvoiceFactory', [zeroAddress]);
    await expect(hash).to.be.revertedWithCustomError(
      invoiceFactory,
      'InvalidWrappedNativeToken',
    );
  });

  it('Should deploy and set DEFAULT_ADMIN and ADMIN roles as msg.sender', async function () {
    const adminRole = await invoiceFactory.read.hasRole([
      await invoiceFactory.read.ADMIN(),
      owner.account.address,
    ]);
    const defaultAdminRole = await invoiceFactory.read.hasRole([
      await invoiceFactory.read.DEFAULT_ADMIN_ROLE(),
      owner.account.address,
    ]);
    expect(adminRole).to.equal(true);
    expect(defaultAdminRole).to.equal(true);
  });

  it('Should addImplementation as an admin', async function () {
    await expect(
      invoiceFactory.write.addImplementation([escrowType, escrow.address]),
    ).not.to.be.reverted;
  });

  it('Should addImplementation and emit AddImplementation event', async function () {
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

  it('Implementation getter should return correct implementation', async function () {
    const implementation = getAddress(escrow.address);
    await invoiceFactory.write.addImplementation([escrowType, implementation]);
    expect(
      await invoiceFactory.read.getImplementation([escrowType, 0n]),
    ).to.be.equal(implementation);
  });

  it('Should revert addImplementation if non-admin', async function () {
    const implementation = escrow.address;
    const receipt = invoiceFactory.write.addImplementation(
      [escrowType, implementation],
      {
        account: client.account,
      },
    );
    await expect(receipt).to.be.reverted;
  });

  it('Should deploy a SmartInvoiceEscrow', async function () {
    await invoiceFactory.write.addImplementation([escrowType, escrow.address]);
    const version = await invoiceFactory.read.currentVersions([escrowType]);
    data = encodeInitData(escrowInitData);

    const hash = await invoiceFactory.write.create([
      provider.account.address,
      amounts,
      data,
      escrowType,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const address = await awaitInvoiceAddress(receipt);
    expect(address).to.not.equal(undefined);
    invoiceAddress = address!;

    await expect(hash)
      .to.emit(invoiceFactory, 'InvoiceCreated')
      .withArgs(0, invoiceAddress, amounts, escrowType, version);

    const invoice = await viem.getContractAt(
      'SmartInvoiceEscrow',
      invoiceAddress,
    );
    expect(await invoice.read.client()).to.equal(
      getAddress(client.account.address),
    );
    expect(await invoice.read.clientReceiver()).to.equal(
      getAddress(clientReceiver.account.address),
    );
    expect(await invoice.read.provider()).to.equal(
      getAddress(provider.account.address),
    );
    expect(await invoice.read.providerReceiver()).to.equal(
      getAddress(providerReceiver.account.address),
    );
    expect(await invoice.read.resolverType()).to.equal(resolverType);
    expect(await invoice.read.resolver()).to.equal(
      getAddress(resolver.account.address),
    );
    expect(await invoice.read.token()).to.equal(token);

    for (let i = 0; i < amounts.length; i += 1) {
      const v = BigInt(amounts[i]);
      // eslint-disable-next-line no-await-in-loop
      expect(await invoice.read.amounts([BigInt(i)])).to.equal(v);
    }

    expect(await invoice.read.terminationTime()).to.equal(terminationTime);
    expect(await invoice.read.resolutionRate()).to.equal(20);
    expect(await invoice.read.milestone()).to.equal(0);
    expect(await invoice.read.total()).to.equal(total);
    expect(await invoice.read.locked()).to.equal(false);
    expect(await invoice.read.disputeId()).to.equal(0);
    expect(await invoice.read.WRAPPED_NATIVE_TOKEN()).to.equal(
      wrappedNativeToken,
    );
    expect(await invoiceFactory.read.getInvoiceAddress([0n])).to.equal(
      invoiceAddress,
    );
  });

  it('Should revert create if no implementation of _type', async function () {
    const fakeType = toHex(toBytes('fake', { size: 32 }));
    data = encodeAbiParameters([{ type: 'string' }], ['']);
    const txHash = invoiceFactory.write.create([
      provider.account.address,
      amounts,
      '0x',
      fakeType,
    ]);
    await expect(txHash).to.be.revertedWithCustomError(
      invoiceFactory,
      'ImplementationDoesNotExist',
    );
  });

  it('Should predict SmartInvoice address', async function () {
    await invoiceFactory.write.addImplementation([escrowType, escrow.address]);
    const version = await invoiceFactory.read.currentVersions([escrowType]);
    data = encodeInitData(escrowInitData);

    const predictedAddress =
      await invoiceFactory.read.predictDeterministicAddress([
        escrowType,
        zeroHash,
      ]);
    const hash = await invoiceFactory.write.createDeterministic([
      provider.account.address,
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
      .to.emit(invoiceFactory, 'InvoiceCreated')
      .withArgs(0, invoiceAddress, amounts, escrowType, version);

    expect(invoiceAddress).to.equal(predictedAddress);
    expect(await invoiceFactory.read.getInvoiceAddress([0n])).to.equal(
      invoiceAddress,
    );
  });

  it('Should update resolutionRate', async function () {
    let resolutionRate = await invoiceFactory.read.resolutionRates([
      resolver.account.address,
    ]);
    expect(resolutionRate).to.equal(0);

    const txHash = await invoiceFactory.write.updateResolutionRate(
      [10n, zeroHash],
      { account: resolver.account },
    );
    await expect(txHash)
      .to.emit(invoiceFactory, 'UpdateResolutionRate')
      .withArgs(getAddress(resolver.account.address), 10, zeroHash);

    resolutionRate = await invoiceFactory.read.resolutionRates([
      resolver.account.address,
    ]);
    expect(resolutionRate).to.equal(10n);
  });

  it('Should deploy with new resolutionRate', async function () {
    await invoiceFactory.write.addImplementation([escrowType, escrow.address]);
    const version = 0;

    data = encodeInitData(escrowInitData);

    await invoiceFactory.write.updateResolutionRate([10n, zeroHash], {
      account: resolver.account,
    });
    const hash = await invoiceFactory.write.create([
      provider.account.address,
      amounts,
      data,
      escrowType,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const address = await awaitInvoiceAddress(receipt);
    expect(address).to.not.equal(undefined);
    invoiceAddress = address!;

    await expect(hash)
      .to.emit(invoiceFactory, 'InvoiceCreated')
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

  it('Should update invoiceCount', async function () {
    await invoiceFactory.write.addImplementation([escrowType, escrow.address]);

    data = encodeInitData(escrowInitData);

    expect(await invoiceFactory.read.invoiceCount()).to.equal(0n);
    let hash = await invoiceFactory.write.create([
      provider.account.address,
      amounts,
      data,
      escrowType,
    ]);
    let receipt = await publicClient.waitForTransactionReceipt({ hash });
    const invoice0 = await awaitInvoiceAddress(receipt);
    expect(await invoiceFactory.read.invoiceCount()).to.equal(1n);

    hash = await invoiceFactory.write.create([
      provider.account.address,
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

  it('Should deploy and fund an escrow successfully', async function () {
    const implementation = getAddress(escrow.address);
    await invoiceFactory.write.addImplementation([escrowType, implementation]);
    const fundAmount = milestoneAmounts.reduce(
      (sum, value) => sum + value,
      BigInt(0),
    );

    // mock ERC20 token balance for client
    await tokenContract.write.setBalanceOf([
      client.account.address,
      fundAmount,
    ]);

    // Approve the invoiceFactory contract to transfer tokens
    await tokenContract.write.approve([invoiceFactory.address, fundAmount], {
      account: client.account,
    });

    const allowance = await tokenContract.read.allowance([
      client.account.address,
      invoiceFactory.address,
    ]);

    expect(allowance).to.be.greaterThanOrEqual(fundAmount);

    data = encodeInitData(escrowInitData);

    const txHash = await invoiceFactory.write.createAndDeposit(
      [
        getAddress(provider.account.address),
        milestoneAmounts,
        data,
        escrowType,
        fundAmount,
      ],
      { account: client.account },
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const escrowAddress = await awaitInvoiceAddress(receipt);

    expect(escrowAddress).to.not.equal(undefined);
    expect(escrowAddress).to.not.equal(zeroAddress);

    if (!escrowAddress) {
      throw new Error('Escrow address is undefined');
    }

    expect(txHash)
      .to.emit(invoiceFactory, 'EscrowFunded')
      .withArgs(escrowAddress, getAddress(escrowInitData.token), fundAmount);

    // Verify escrow contract has the correct token balance
    const escrowBalance = await tokenContract.read.balanceOf([escrowAddress]);
    expect(escrowBalance).to.equal(fundAmount);

    const invoice = await viem.getContractAt(
      'SmartInvoiceEscrow',
      escrowAddress,
    );

    expect(await invoice.read.client()).to.equal(
      getAddress(client.account.address),
    );
    expect(await invoice.read.provider()).to.equal(
      getAddress(provider.account.address),
    );
    expect(await invoice.read.resolverType()).to.equal(0);
    expect(await invoice.read.resolver()).to.equal(
      getAddress(resolver.account.address),
    );
    expect(await invoice.read.token()).to.equal(
      getAddress(tokenContract.address),
    );

    for (let i = 0; i < milestoneAmounts.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect(await invoice.read.amounts([BigInt(i)])).to.equal(
        milestoneAmounts[i],
      );
    }
    expect(await invoice.read.terminationTime()).to.equal(
      escrowInitData.terminationTime,
    );
    expect(await invoice.read.resolutionRate()).to.equal(20n);
    expect(await invoice.read.milestone()).to.equal(0n);
    expect(await invoice.read.total()).to.equal(fundAmount);
    expect(await invoice.read.locked()).to.equal(false);
    expect(await invoice.read.disputeId()).to.equal(0n);
    expect(await invoice.read.WRAPPED_NATIVE_TOKEN()).to.equal(
      getAddress(wrappedNativeTokenContract.address),
    );
    expect(await invoice.read.providerReceiver()).to.equal(
      getAddress(escrowInitData.providerReceiver),
    );
    expect(await invoice.read.clientReceiver()).to.equal(
      getAddress(escrowInitData.clientReceiver),
    );
  });

  it('Should deploy and fund an escrow with native ETH', async function () {
    const implementation = getAddress(escrow.address);
    await invoiceFactory.write.addImplementation([escrowType, implementation]);
    const fundAmount = milestoneAmounts.reduce(
      (sum, value) => sum + value,
      BigInt(0),
    );

    data = encodeInitData({ ...escrowInitData, token: wrappedNativeToken });

    const txHash = await invoiceFactory.write.createAndDeposit(
      [
        getAddress(provider.account.address),
        milestoneAmounts,
        data,
        escrowType,
        fundAmount,
      ],
      { account: client.account, value: fundAmount },
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const escrowAddress = await awaitInvoiceAddress(receipt);

    expect(escrowAddress).to.not.equal(undefined);
    expect(escrowAddress).to.not.equal(zeroAddress);

    if (!escrowAddress) {
      throw new Error('Escrow address is undefined');
    }

    expect(txHash)
      .to.emit(invoiceFactory, 'EscrowFunded')
      .withArgs(
        escrowAddress,
        getAddress(wrappedNativeTokenContract.address),
        fundAmount,
      );

    // Verify escrow contract has the correct token balance
    const escrowBalance = await wrappedNativeTokenContract.read.balanceOf([
      escrowAddress,
    ]);
    expect(escrowBalance).to.equal(fundAmount);

    const invoice = await viem.getContractAt(
      'SmartInvoiceEscrow',
      escrowAddress,
    );

    expect(await invoice.read.client()).to.equal(
      getAddress(client.account.address),
    );
    expect(await invoice.read.provider()).to.equal(
      getAddress(provider.account.address),
    );
    expect(await invoice.read.resolverType()).to.equal(0);
    expect(await invoice.read.resolver()).to.equal(
      getAddress(resolver.account.address),
    );
    expect(await invoice.read.token()).to.equal(
      getAddress(wrappedNativeTokenContract.address),
    );

    for (let i = 0; i < milestoneAmounts.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect(await invoice.read.amounts([BigInt(i)])).to.equal(
        milestoneAmounts[i],
      );
    }
    expect(await invoice.read.terminationTime()).to.equal(
      escrowInitData.terminationTime,
    );
    expect(await invoice.read.resolutionRate()).to.equal(20n);
    expect(await invoice.read.milestone()).to.equal(0n);
    expect(await invoice.read.total()).to.equal(fundAmount);
    expect(await invoice.read.locked()).to.equal(false);
    expect(await invoice.read.disputeId()).to.equal(0n);
    expect(await invoice.read.WRAPPED_NATIVE_TOKEN()).to.equal(
      getAddress(wrappedNativeTokenContract.address),
    );
    expect(await invoice.read.providerReceiver()).to.equal(
      getAddress(escrowInitData.providerReceiver),
    );
    expect(await invoice.read.clientReceiver()).to.equal(
      getAddress(escrowInitData.clientReceiver),
    );
  });
});

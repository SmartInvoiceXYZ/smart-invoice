import {
  PublicClient,
  TestClient,
  WalletClient,
} from '@nomicfoundation/hardhat-viem/types';
import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import {
  encodeAbiParameters,
  getAddress,
  toBytes,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem';

import {
  awaitInvoiceAddress,
  createInstantInvoice,
  createInstantInvoiceHash,
  currentTimestamp,
  setApproval,
  setBalanceOf,
} from './utils';

const amounts = [10n, 10n];
const total = amounts.reduce((t, v) => t + v, 0n);
const terminationTime = BigInt(
  Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
);
const lateFeeAmount = 10n;
const lateFeeTimeInterval = 3600;
const invoiceType = toHex(toBytes('instant', { size: 32 }));

describe('SmartInvoiceInstant', function () {
  let publicClient: PublicClient;
  let testClient: TestClient;
  let client: WalletClient;
  let provider: WalletClient;
  let factory: ContractTypesMap['SmartInvoiceFactory'];
  let invoice: ContractTypesMap['SmartInvoiceInstant'];
  let mockToken: ContractTypesMap['MockToken'];
  let otherMockToken: ContractTypesMap['MockToken'];
  let mockWrappedNativeToken: ContractTypesMap['MockWETH'];

  beforeEach(async function () {
    testClient = await viem.getTestClient();
    publicClient = await viem.getPublicClient();
    [client, provider] = await viem.getWalletClients();

    mockToken = await viem.deployContract('MockToken');
    otherMockToken = await viem.deployContract('MockToken');
    mockWrappedNativeToken = await viem.deployContract('MockWETH');

    const invoiceImpl = await viem.deployContract('SmartInvoiceInstant');

    const invoiceFactory = await viem.deployContract('SmartInvoiceFactory', [
      mockWrappedNativeToken.address,
    ]);

    await invoiceFactory.write.addImplementation([
      invoiceType,
      invoiceImpl.address,
    ]);

    const data = encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'address' },
        { type: 'uint256' },
        { type: 'bytes32' },
        { type: 'address' },
        { type: 'uint256' },
        { type: 'uint256' },
      ],
      [
        client.account.address,
        mockToken.address,
        terminationTime,
        zeroHash,
        mockWrappedNativeToken.address,
        lateFeeAmount,
        BigInt(lateFeeTimeInterval),
      ],
    );
    const hash = await invoiceFactory.write.create([
      getAddress(provider.account.address),
      amounts,
      data,
      invoiceType,
    ]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const address = await awaitInvoiceAddress(receipt);
    if (!address) {
      throw new Error('Invoice address not found');
    }

    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);
    factory = invoiceFactory;
  });

  it('Should deploy a SmartInvoiceInstant', async function () {
    expect(await invoice.read.client()).to.equal(
      getAddress(client.account.address),
    );
    expect(await invoice.read.provider()).to.equal(
      getAddress(provider.account.address),
    );
    expect(await invoice.read.token()).to.equal(getAddress(mockToken.address));
    amounts.map(async (v, i) => {
      expect(await invoice.read.amounts([BigInt(i)])).to.equal(v);
    });
    expect(await invoice.read.deadline()).to.equal(terminationTime);
    expect(await invoice.read.details()).to.equal(zeroHash);
    expect(await invoice.read.total()).to.equal(total);
    expect(await invoice.read.wrappedNativeToken()).to.equal(
      BigInt(mockWrappedNativeToken.address),
    );
    expect(await invoice.read.lateFee()).to.equal(lateFeeAmount);
    expect(await invoice.read.lateFeeTimeInterval()).to.equal(
      lateFeeTimeInterval,
    );
  });

  it('Should revert init if initLocked', async function () {
    const invoice1 = await viem.deployContract('SmartInvoiceInstant');

    const data = encodeAbiParameters(
      [
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'uint256',
        'uint256',
      ].map(x => ({ type: x })),
      [
        client.account.address,
        mockToken.address,
        BigInt(terminationTime), // exact termination date in seconds since epoch
        zeroHash,
        mockWrappedNativeToken.address,
        lateFeeAmount,
        lateFeeTimeInterval,
      ],
    );

    const hash = invoice1.write.init([provider.account.address, amounts, data]);
    await expect(hash).to.be.revertedWithCustomError(
      invoice1,
      'InvalidInitialization',
    );
  });

  it('Should revert init if invalid client', async function () {
    const receipt = createInstantInvoiceHash(
      factory,
      invoice,
      invoiceType,
      zeroAddress,
      provider.account.address,
      mockToken.address,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWithCustomError(invoice, 'InvalidClient');
  });

  it('Should revert init if invalid provider', async function () {
    const receipt = createInstantInvoiceHash(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      zeroAddress,
      mockToken.address,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWithCustomError(
      invoice,
      'InvalidProvider',
    );
  });

  it('Should revert init if invalid token', async function () {
    const receipt = createInstantInvoiceHash(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      zeroAddress,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWithCustomError(invoice, 'InvalidToken');
  });

  it('Should revert init if invalid wrappedNativeToken', async function () {
    const receipt = createInstantInvoiceHash(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      amounts,
      terminationTime,
      zeroHash,
      zeroAddress,
    );
    await expect(receipt).to.revertedWithCustomError(
      invoice,
      'InvalidWrappedNativeToken',
    );
  });

  it('Should revert init if deadline has ended', async function () {
    const currentTime = await currentTimestamp();

    const receipt = createInstantInvoiceHash(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      amounts,
      currentTime - 3600,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWithCustomError(invoice, 'DurationEnded');
  });

  it('Should revert init if deadline too long', async function () {
    const currentTime = await currentTimestamp();

    const receipt = createInstantInvoiceHash(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      amounts,
      currentTime + 5 * 365 * 24 * 3600,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWithCustomError(
      invoice,
      'DurationTooLong',
    );
  });

  it('Should withdraw to provider', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, invoice.address, 20);

    await expect(invoice.write.withdraw())
      .to.emit(invoice, 'Withdraw')
      .withArgs(20);
  });

  it('Should revert withdraw after terminationTime if balance is 0', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);
    await setBalanceOf(mockToken.address, invoice.address, 0);

    await expect(invoice.write.withdraw()).to.be.revertedWithCustomError(
      invoice,
      'BalanceIsZero',
    );
  });

  it('Should call withdraw from withdrawTokens', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, invoice.address, 20);

    await expect(invoice.write.withdrawTokens([mockToken.address]))
      .to.emit(invoice, 'Withdraw')
      .withArgs(20);
  });

  it('Should withdrawTokens for otherToken', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(otherMockToken.address, invoice.address, 20);

    const hash = invoice.write.withdrawTokens([otherMockToken.address]);
    await expect(hash).to.be.not.reverted;
  });

  it('Should revert withdrawTokens for otherToken if balance is 0', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(otherMockToken.address, invoice.address, 0);

    const hash = invoice.write.withdrawTokens([otherMockToken.address]);
    await expect(hash).to.be.revertedWithCustomError(invoice, 'BalanceIsZero');
  });

  it('Should receive and emit Deposit, and convert to wrapped token', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockWrappedNativeToken.address,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    const hash = await client.sendTransaction({
      to: invoice.address,
      value: 10n,
    });
    await expect(hash)
      .to.emit(invoice, 'Deposit')
      .withArgs(getAddress(client.account.address), 10n);
    expect(
      await mockWrappedNativeToken.read.balanceOf([invoice.address]),
    ).to.equal(10n);
  });

  it('Should receive and emit Fulfilled if paid in full', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockWrappedNativeToken.address,
      [10n],
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    const hash = await client.sendTransaction({
      to: invoice.address,
      value: 10n,
    });
    await expect(hash)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(getAddress(client.account.address));
  });

  it('Should receive and emit Fulfilled if paid in series', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockWrappedNativeToken.address,
      [10n],
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    const hash = await client.sendTransaction({
      to: invoice.address,
      value: 5n,
    });

    await expect(hash).to.not.emit(invoice, 'Fulfilled');

    const receipt2 = await client.sendTransaction({
      to: invoice.address,
      value: 5n,
    });
    await expect(receipt2)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(getAddress(client.account.address));
  });

  it('Should receive and set fulfilled true if totalFulfilled at least equals totalDue', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockWrappedNativeToken.address,
      [10n],
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    const hash = await client.sendTransaction({
      to: invoice.address,
      value: 10n,
    });
    await expect(hash)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(getAddress(client.account.address));

    expect(await invoice.read.fulfilled()).to.equal(true);
  });

  it('Should receive and emit Tip if totalFulfilled greater than totalDue', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockWrappedNativeToken.address,
      [10n],
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    const hash = await client.sendTransaction({
      to: invoice.address,
      value: 15n,
    });
    await expect(hash)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(getAddress(client.account.address));

    await expect(hash)
      .to.emit(invoice, 'Tip')
      .withArgs(getAddress(client.account.address), 5n);
  });

  it('Should revert receive if not wrappedNativeToken', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      amounts,
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);
    const hash = client.sendTransaction({
      to: invoice.address,
      value: 10n,
    });
    await expect(hash).to.be.revertedWithCustomError(
      invoice,
      'TokenNotWrappedNativeToken',
    );
  });

  it('Should depositTokens and emit Deposit', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [20n],
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, client.account.address, 10);
    await setApproval(mockToken.address, client.account, invoice.address, 10);

    const hash = await invoice.write.depositTokens([mockToken.address, 10n], {
      account: client.account,
    });
    expect(hash)
      .to.emit(invoice, 'Deposit')
      .withArgs(getAddress(client.account.address), 10n);
    expect(hash)
      .to.emit(mockToken, 'Transfer')
      .withArgs(getAddress(client.account.address), invoice.address, 10n);
    expect(await mockToken.read.balanceOf([invoice.address])).to.equal(10n);
  });

  it('Should depositTokens and emit Fulfilled if paid in full', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, client.account.address, 10);
    await setApproval(mockToken.address, client.account, invoice.address, 10);

    const hash = await invoice.write.depositTokens([mockToken.address, 10n], {
      account: client.account,
    });
    expect(hash)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(getAddress(client.account.address));
  });

  it('Should depositTokens and emit Fulfilled if paid in series', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, client.account.address, 10);
    await setApproval(mockToken.address, client.account, invoice.address, 10);

    const hash = await invoice.write.depositTokens([mockToken.address, 5n], {
      account: client.account,
    });
    expect(hash)
      .to.emit(invoice, 'Deposit')
      .withArgs(getAddress(client.account.address), 5n);
    expect(hash).to.not.emit(invoice, 'Fulfilled');
    const hash2 = await invoice.write.depositTokens([mockToken.address, 5n], {
      account: client.account,
    });
    expect(hash2)
      .to.emit(invoice, 'Deposit')
      .withArgs(getAddress(client.account.address), 5n);
    expect(hash2)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(getAddress(client.account.address));
  });

  it('Should depositTokens and emit Tip if totalFulfilled greater than totalDue', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, client.account.address, 15);
    await setApproval(mockToken.address, client.account, invoice.address, 15);

    const hash = await invoice.write.depositTokens([mockToken.address, 10n], {
      account: client.account,
    });
    expect(hash)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(getAddress(client.account.address));
    expect(hash)
      .to.emit(invoice, 'Tip')
      .withArgs(getAddress(client.account.address), 5n);
    expect(await invoice.read.fulfilled()).to.equal(true);
  });

  it('Should revert depositTokens if _token is not token', async function () {
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      terminationTime,
      zeroHash,
      mockWrappedNativeToken.address,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(otherMockToken.address, client.account.address, 10);
    await setApproval(
      otherMockToken.address,
      client.account,
      invoice.address,
      10,
    );

    const hash = invoice.write.depositTokens([otherMockToken.address, 10n], {
      account: client.account,
    });
    await expect(hash).to.be.revertedWithCustomError(invoice, 'TokenMismatch');
  });

  it('Should getTotalDue and return sum greater than total if late fee', async function () {
    const currentTime = await currentTimestamp();

    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      lateFeeAmount,
      lateFeeTimeInterval,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await testClient.increaseTime({ seconds: 1000 + lateFeeTimeInterval });
    await testClient.mine({ blocks: 1 });

    expect(await invoice.read.lateFeeTimeInterval()).to.equal(
      lateFeeTimeInterval,
    );
    expect(await invoice.read.lateFee()).to.equal(lateFeeAmount);
    expect(await invoice.read.fulfilled()).to.equal(false);
    expect(await invoice.read.deadline()).to.equal(currentTime + 1000);

    expect(await invoice.read.getTotalDue()).to.equal(10n + lateFeeAmount);
  });

  it('Should getTotalDue and return total if 0 late fee or 0 deadline', async function () {
    const currentTime = await currentTimestamp();

    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      0,
      0,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await testClient.increaseTime({ seconds: 1000 + lateFeeTimeInterval });
    await testClient.mine({ blocks: 1 });

    const totalDue = await invoice.read.getTotalDue();
    expect(totalDue).to.equal(10n);
  });

  it('Should getTotalDue and return sum of total + lateFee based on fulfillTime', async function () {
    const currentTime = await currentTimestamp();

    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      lateFeeAmount,
      lateFeeTimeInterval,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, client.account.address, 25);
    await setApproval(mockToken.address, client.account, invoice.address, 25);

    const hash = await invoice.write.depositTokens([mockToken.address, 5n], {
      account: client.account,
    });
    expect(hash).to.not.emit(invoice, 'Fulfilled');

    expect(await invoice.read.getTotalDue()).to.equal(10n);

    await testClient.increaseTime({ seconds: 1000 + lateFeeTimeInterval });
    await testClient.mine({ blocks: 1 });

    const hash2 = await invoice.write.depositTokens([mockToken.address, 15n], {
      account: client.account,
    });
    expect(hash2)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(client.account.address);
    const totalDueAtFulfill = await invoice.read.getTotalDue();
    expect(totalDueAtFulfill).to.equal(10n + 10n);
    const receipt2 = await publicClient.waitForTransactionReceipt({
      hash: hash2,
    });
    const block2 = await publicClient.getBlock({
      blockNumber: receipt2.blockNumber,
    });

    expect(await invoice.read.fulfilled()).to.equal(true);
    expect(await invoice.read.fulfillTime()).to.equal(block2.timestamp);

    await testClient.increaseTime({ seconds: 1000 + lateFeeTimeInterval * 7 });
    await testClient.mine({ blocks: 1 });

    await invoice.write.tip([mockToken.address, 5n], {
      account: client.account,
    });
    const totalDuePostFulfill = await invoice.read.getTotalDue();
    expect(totalDuePostFulfill).to.equal(totalDueAtFulfill);
  });

  it('Should tip and emit Tip event', async function () {
    const currentTime = await currentTimestamp();

    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      lateFeeAmount,
      lateFeeTimeInterval,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, client.account.address, 20);
    await setApproval(mockToken.address, client.account, invoice.address, 20);
    const depositReceipt = await invoice.write.depositTokens(
      [mockToken.address, 10n],
      { account: client.account },
    );
    expect(depositReceipt).to.emit(invoice, 'Fulfilled');

    const tipReceipt = await invoice.write.tip([mockToken.address, 10n], {
      account: client.account,
    });
    expect(tipReceipt)
      .to.emit(invoice, 'Tip')
      .withArgs(client.account.address, 10);
  });

  it('Should tip and add amount to totalFulfilled', async function () {
    const currentTime = await currentTimestamp();

    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      lateFeeAmount,
      lateFeeTimeInterval,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, client.account.address, 20);
    await setApproval(mockToken.address, client.account, invoice.address, 20);
    const depositReceipt = await invoice.write.depositTokens(
      [mockToken.address, 10n],
      { account: client.account },
    );
    expect(depositReceipt).to.emit(invoice, 'Fulfilled');
    expect(await invoice.read.totalFulfilled()).to.equal(10);

    const tipReceipt = await invoice.write.tip([mockToken.address, 10n], {
      account: client.account,
    });
    expect(tipReceipt)
      .to.emit(invoice, 'Tip')
      .withArgs(client.account.address, 10);
    expect(await invoice.read.totalFulfilled()).to.equal(20);
  });

  it('Should revert tip if fulfilled is false', async function () {
    const currentTime = await currentTimestamp();

    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      lateFeeAmount,
      lateFeeTimeInterval,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, client.account.address, 20);
    await setApproval(mockToken.address, client.account, invoice.address, 20);
    const depositReceipt = await invoice.write.depositTokens(
      [mockToken.address, 5n],
      { account: client.account },
    );
    expect(depositReceipt).to.not.emit(invoice, 'Fulfilled');

    const tipReceipt = invoice.write.tip([mockToken.address, 10n], {
      account: client.account,
    });

    expect(tipReceipt).to.be.revertedWith('!fulfilled');
    expect(await invoice.read.fulfilled()).to.equal(false);
    expect(await invoice.read.totalFulfilled()).to.equal(5);
  });

  it('Should revert tip if not token', async function () {
    const currentTime = await currentTimestamp();

    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      lateFeeAmount,
      lateFeeTimeInterval,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await setBalanceOf(mockToken.address, client.account.address, 20);
    await setApproval(mockToken.address, client.account, invoice.address, 20);
    const depositReceipt = await invoice.write.depositTokens(
      [mockToken.address, 5n],
      { account: client.account },
    );
    expect(depositReceipt).to.not.emit(invoice, 'Fulfilled');

    const tipReceipt = invoice.write.tip([otherMockToken.address, 10n], {
      account: client.account,
    });

    expect(tipReceipt).to.be.revertedWithCustomError(invoice, 'InvalidToken');
    expect(await invoice.read.fulfilled()).to.equal(false);
    expect(await invoice.read.totalFulfilled()).to.equal(5);
  });

  it('Should depositTokens and fulfill with applied late fees', async function () {
    const currentTime = await currentTimestamp();

    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      lateFeeAmount,
      lateFeeTimeInterval,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await testClient.increaseTime({ seconds: 1000 + lateFeeTimeInterval });
    await testClient.mine({ blocks: 1 });

    await setBalanceOf(mockToken.address, client.account.address, 20);
    await setApproval(mockToken.address, client.account, invoice.address, 20);
    const totalDue = await invoice.read.getTotalDue();
    expect(totalDue).to.equal(10 + 10);
    const hash = await invoice.write.depositTokens([mockToken.address, 10n], {
      account: client.account,
    });
    expect(hash).to.not.emit(invoice, 'Fulfilled');
    expect(await invoice.read.fulfilled()).to.equal(false);
    expect(await invoice.read.fulfillTime()).to.equal(0);
    const hash2 = await invoice.write.depositTokens([mockToken.address, 10n], {
      account: client.account,
    });
    expect(hash2)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(client.account.address);
    expect(await invoice.read.fulfilled()).to.equal(true);
  });

  it('Should depositTokens and update fulfillTime', async function () {
    const currentTime = await currentTimestamp();

    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockToken.address,
      [10n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      lateFeeAmount,
      lateFeeTimeInterval,
    );
    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);

    await testClient.increaseTime({ seconds: 1000 + lateFeeTimeInterval });
    await testClient.mine({ blocks: 1 });

    await setBalanceOf(mockToken.address, client.account.address, 20);
    await setApproval(mockToken.address, client.account, invoice.address, 20);
    const totalDue = await invoice.read.getTotalDue();
    expect(totalDue).to.equal(10 + 10);
    const hash = await invoice.write.depositTokens([mockToken.address, 10n], {
      account: client.account,
    });
    expect(hash).to.not.emit(invoice, 'Fulfilled');
    expect(await invoice.read.fulfilled()).to.equal(false);
    expect(await invoice.read.fulfillTime()).to.equal(0);
    const hash2 = await invoice.write.depositTokens([mockToken.address, 10n], {
      account: client.account,
    });
    expect(hash2)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(client.account.address);
    expect(await invoice.read.fulfilled()).to.equal(true);

    const receipt2 = await publicClient.waitForTransactionReceipt({
      hash: hash2,
    });
    const block2 = await publicClient.getBlock({
      blockNumber: receipt2.blockNumber,
    });
    const blockTimestamp = block2.timestamp;

    expect(await invoice.read.fulfillTime()).to.equal(blockTimestamp);
  });

  it('Should receive and fulfill with applied late fees', async function () {
    const currentTime = await currentTimestamp();
    const receipt = await createInstantInvoice(
      factory,
      invoice,
      invoiceType,
      client.account.address,
      provider.account.address,
      mockWrappedNativeToken.address,
      [15n],
      currentTime + 1000,
      zeroHash,
      mockWrappedNativeToken.address,
      lateFeeAmount,
      lateFeeTimeInterval,
    );

    const address = await awaitInvoiceAddress(receipt);
    invoice = await viem.getContractAt('SmartInvoiceInstant', address!);
    await testClient.increaseTime({ seconds: 1000 + lateFeeTimeInterval });
    await testClient.mine({ blocks: 1 });

    const hash = await client.sendTransaction({
      to: invoice.address,
      value: 10n,
    });
    expect(hash).to.not.emit(invoice, 'Fulfilled');
    expect(await invoice.read.fulfilled()).to.equal(false);

    const hash2 = await client.sendTransaction({
      to: invoice.address,
      value: 20n,
    });
    expect(hash2)
      .to.emit(invoice, 'Fulfilled')
      .withArgs(client.account.address);
    expect(hash2).to.emit(invoice, 'Tip').withArgs(client.account.address, 5);
    expect(await invoice.read.fulfilled()).to.equal(true);
  });
});

import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import {
  Account,
  encodeAbiParameters,
  getAddress,
  GetContractReturnType,
  GetTransactionReceiptReturnType,
  Hex,
  parseAbi,
  parseEventLogs,
  zeroHash,
} from 'viem';

export const awaitInvoiceAddress = async (
  receipt: GetTransactionReceiptReturnType,
): Promise<Hex | null> => {
  if (!receipt || !receipt.logs) return null;

  const abi = parseAbi([
    'event LogNewInvoice(uint256 indexed id, address indexed invoice, uint256[] amounts, bytes32 invoiceType, uint256 version)',
  ]);

  const logs = parseEventLogs({ abi, logs: receipt.logs });
  const event = logs.find(log => log.eventName === 'LogNewInvoice');

  if (event) {
    return getAddress(event.args.invoice);
  }
  return null;
};

export const currentTimestamp = async (): Promise<number> => {
  const publicClient = await viem.getPublicClient();
  const block = await publicClient.getBlock();
  return Number(block.timestamp);
};

export const createEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoice: GetContractReturnType,
  type: Hex,
  client: Hex,
  provider: Hex,
  resolverType: number,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  terminationTime: number,
  details: Hex,
  wrappedNativeToken: Hex,
  requireVerification: boolean,
): Promise<GetTransactionReceiptReturnType> => {
  await factory.write.addImplementation([type, invoice.address]);

  const data = encodeAbiParameters(
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
    ].map(x => ({ type: x })),
    [
      client,
      resolverType,
      resolver,
      token,
      BigInt(terminationTime), // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      requireVerification,
      factory.address,
      '0x0000000000000000000000000000000000000000', // no providerReceiver
      '0x0000000000000000000000000000000000000000', // no clientReceiver
    ],
  );

  const hash = await factory.write.create([provider, amounts, data, type]);

  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

export const setBalanceOf = async (
  token: Hex,
  address: Hex,
  amount: bigint | number,
) => {
  const tokenContract = await viem.getContractAt('MockToken', token);
  const hash = await tokenContract.write.setBalanceOf([
    address,
    BigInt(amount),
  ]);
  await (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

export const getBalanceOf = async (
  token: Hex,
  address: Hex,
): Promise<bigint> => {
  const tokenContract = await viem.getContractAt('MockToken', token);
  return tokenContract.read.balanceOf([address]);
};

export const setApproval = async (
  token: Hex,
  owner: Account,
  spender: Hex,
  amount: bigint | number,
) => {
  const tokenContract = await viem.getContractAt('MockToken', token);
  const hash = await tokenContract.write.approve([spender, BigInt(amount)], {
    account: owner,
  });
  await (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

export const getLockedEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoiceType: Hex,
  client: Hex,
  provider: Hex,
  resolverType: number,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  details: Hex,
  mockWrappedNativeToken: Hex,
  value = 0n,
  requireVerification: boolean = false,
): Promise<ContractTypesMap['SmartInvoiceEscrow']> => {
  const currentTime = await currentTimestamp();
  const newInvoice = await viem.deployContract('SmartInvoiceEscrow');

  const initReceipt = await createEscrow(
    factory,
    newInvoice,
    invoiceType,
    client,
    provider,
    resolverType,
    resolver,
    token,
    amounts,
    currentTime + 1000,
    details,
    mockWrappedNativeToken,
    requireVerification,
  );

  const newInvoiceAddress = await awaitInvoiceAddress(initReceipt);
  if (!newInvoiceAddress) {
    throw new Error('Failed to get invoice address');
  }
  const lockedInvoice = await viem.getContractAt(
    'SmartInvoiceEscrow',
    newInvoiceAddress,
  );

  expect(await lockedInvoice.read.locked()).to.equal(false);

  await setBalanceOf(token, newInvoiceAddress, 10n);

  const lockHash = await lockedInvoice.write.lock([zeroHash], { value });

  const receipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({ hash: lockHash });

  const events = parseEventLogs({
    abi: parseAbi(['event Lock(address indexed client, bytes32 id)']),
    logs: receipt.logs,
  });

  expect(events[0].eventName).to.equal('Lock');
  expect(events[0].args.client).to.equal(getAddress(client));
  expect(events[0].args.id).to.equal(zeroHash);

  return lockedInvoice;
};

export const createSplitEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoice: GetContractReturnType,
  type: Hex,
  client: Hex,
  provider: Hex,
  resolverType: number,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  terminationTime: number,
  details: Hex,
  wrappedNativeToken: Hex,
  requireVerification: boolean,
  providerReceiver: Hex,
  clientReceiver: Hex,
  dao: Hex,
  daoFee: bigint,
): Promise<GetTransactionReceiptReturnType> => {
  await factory.write.addImplementation([type, invoice.address]);

  const data = encodeAbiParameters(
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
      'address',
      'uint256',
    ].map(x => ({ type: x })),
    [
      client,
      resolverType,
      resolver,
      token,
      BigInt(terminationTime), // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      requireVerification,
      factory.address,
      providerReceiver,
      clientReceiver,
      dao,
      daoFee,
    ],
  );

  const hash = await factory.write.create([provider, amounts, data, type]);
  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

export const createUpdatableV2Escrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoice: GetContractReturnType,
  type: Hex,
  client: Hex,
  provider: Hex,
  resolverType: number,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  terminationTime: bigint | number,
  details: Hex,
  wrappedNativeToken: Hex,
  requireVerification: boolean,
  providerReceiver: Hex,
  clientReceiver: Hex,
): Promise<GetTransactionReceiptReturnType> => {
  await factory.write.addImplementation([type, invoice.address]);

  const data = encodeAbiParameters(
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
    ].map(x => ({ type: x })),
    [
      client,
      resolverType,
      resolver,
      token,
      BigInt(terminationTime), // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      requireVerification,
      factory.address,
      providerReceiver,
      clientReceiver,
    ],
  );

  const hash = await factory.write.create([provider, amounts, data, type]);
  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

export const createUpdatableEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoice: GetContractReturnType,
  type: Hex,
  client: Hex,
  provider: Hex,
  resolverType: number,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  terminationTime: bigint | number,
  details: Hex,
  wrappedNativeToken: Hex,
  requireVerification: boolean,
  providerReceiver: Hex,
): Promise<GetTransactionReceiptReturnType> => {
  await factory.write.addImplementation([type, invoice.address]);

  const data = encodeAbiParameters(
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
    ].map(x => ({ type: x })),
    [
      client,
      resolverType,
      resolver,
      token,
      BigInt(terminationTime), // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      requireVerification,
      factory.address,
      providerReceiver,
    ],
  );

  const hash = await factory.write.create([provider, amounts, data, type]);
  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

export const getLockedUpdatableV2Escrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoiceType: Hex,
  client: Hex,
  provider: Hex,
  resolverType: number,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  details: Hex,
  mockWrappedNativeToken: Hex,
  providerReceiver: Hex,
  clientReceiver: Hex,
  value = 0n,
  requireVerification: boolean = false,
): Promise<ContractTypesMap['SmartInvoiceUpdatableV2']> => {
  const currentTime = await currentTimestamp();
  const newInvoice = await viem.deployContract('SmartInvoiceUpdatableV2');

  const initReceipt = await createUpdatableV2Escrow(
    factory,
    newInvoice,
    invoiceType,
    client,
    provider,
    resolverType,
    resolver,
    token,
    amounts,
    BigInt(currentTime + 1000),
    details,
    mockWrappedNativeToken,
    requireVerification,
    providerReceiver,
    clientReceiver,
  );

  const newInvoiceAddress = await awaitInvoiceAddress(initReceipt);
  if (!newInvoiceAddress) {
    throw new Error('Failed to get invoice address');
  }

  const lockedInvoice = await viem.getContractAt(
    'SmartInvoiceUpdatableV2',
    newInvoiceAddress,
  );

  expect(await lockedInvoice.read.locked()).to.equal(false);

  await setBalanceOf(token, newInvoiceAddress, 10n);

  const hash = await lockedInvoice.write.lock([zeroHash], { value });

  const receipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({ hash });

  const events = parseEventLogs({
    abi: parseAbi(['event Lock(address indexed client, bytes32 id)']),
    logs: receipt.logs,
  });

  expect(events[0].eventName).to.equal('Lock');
  expect(events[0].args.client).to.equal(getAddress(client));
  expect(events[0].args.id).to.equal(zeroHash);

  return lockedInvoice;
};

export const getLockedUpdatableEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoiceType: Hex,
  client: Hex,
  provider: Hex,
  resolverType: number,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  details: Hex,
  mockWrappedNativeToken: Hex,
  providerReceiver: Hex,
  value = 0n,
  requireVerification: boolean = false,
): Promise<ContractTypesMap['SmartInvoiceUpdatable']> => {
  const currentTime = await currentTimestamp();
  const newInvoice = await viem.deployContract('SmartInvoiceUpdatable');

  const initReceipt = await createUpdatableEscrow(
    factory,
    newInvoice,
    invoiceType,
    client,
    provider,
    resolverType,
    resolver,
    token,
    amounts,
    BigInt(currentTime + 1000),
    details,
    mockWrappedNativeToken,
    requireVerification,
    providerReceiver,
  );

  const newInvoiceAddress = await awaitInvoiceAddress(initReceipt);
  if (!newInvoiceAddress) {
    throw new Error('Failed to get invoice address');
  }

  const lockedInvoice = await viem.getContractAt(
    'SmartInvoiceUpdatable',
    newInvoiceAddress,
  );

  expect(await lockedInvoice.read.locked()).to.equal(false);

  await setBalanceOf(token, newInvoiceAddress, 10n);

  const hash = await lockedInvoice.write.lock([zeroHash], { value });

  const receipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({ hash });

  const events = parseEventLogs({
    abi: parseAbi(['event Lock(address indexed client, bytes32 id)']),
    logs: receipt.logs,
  });

  expect(events[0].eventName).to.equal('Lock');
  expect(events[0].args.client).to.equal(getAddress(client));
  expect(events[0].args.id).to.equal(zeroHash);

  return lockedInvoice;
};

export const getLockedSplitEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoiceType: Hex,
  client: Hex,
  provider: Hex,
  resolverType: number,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  details: Hex,
  mockWrappedNativeToken: Hex,
  providerReceiver: Hex,
  clientReceiver: Hex,
  dao: Hex,
  daoFee: bigint,
  value = 0n,
  requireVerification: boolean = false,
): Promise<ContractTypesMap['SmartInvoiceSplitEscrow']> => {
  const currentTime = await currentTimestamp();
  const newInvoice = await viem.deployContract('SmartInvoiceSplitEscrow');

  const initReceipt = await createSplitEscrow(
    factory,
    newInvoice,
    invoiceType,
    client,
    provider,
    resolverType,
    resolver,
    token,
    amounts,
    currentTime + 1000,
    details,
    mockWrappedNativeToken,
    requireVerification,
    providerReceiver,
    clientReceiver,
    dao,
    daoFee,
  );

  const newInvoiceAddress = await awaitInvoiceAddress(initReceipt);
  if (!newInvoiceAddress) {
    throw new Error('Failed to get invoice address');
  }
  const lockedInvoice = await viem.getContractAt(
    'SmartInvoiceSplitEscrow',
    newInvoiceAddress,
  );

  expect(await lockedInvoice.read.locked()).to.equal(false);

  await setBalanceOf(token, newInvoiceAddress, 10n);
  const hash = await lockedInvoice.write.lock([zeroHash], { value });

  const receipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({ hash });

  const events = parseEventLogs({
    abi: parseAbi(['event Lock(address indexed client, bytes32 id)']),
    logs: receipt.logs,
  });

  expect(events[0].eventName).to.equal('Lock');
  expect(events[0].args.client).to.equal(getAddress(client));
  expect(events[0].args.id).to.equal(zeroHash);

  return lockedInvoice;
};

export const createInstantInvoiceHash = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoice: ContractTypesMap['SmartInvoiceInstant'],
  type: Hex,
  client: Hex,
  provider: Hex,
  token: Hex,
  amounts: bigint[],
  deadline: number | bigint,
  details: Hex,
  wrappedNativeToken: Hex,
  lateFeeAmount: bigint | number = 0n,
  lateFeeTimeInterval: number | bigint = 0n,
): Promise<Hex> => {
  await factory.write.addImplementation([type, invoice.address]);

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
      client,
      token,
      BigInt(deadline), // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      BigInt(lateFeeAmount),
      BigInt(lateFeeTimeInterval),
    ],
  );

  return factory.write.create([provider, amounts, data, type]);
};

export const createInstantInvoice = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  invoice: ContractTypesMap['SmartInvoiceInstant'],
  type: Hex,
  client: Hex,
  provider: Hex,
  token: Hex,
  amounts: bigint[],
  deadline: number | bigint,
  details: Hex,
  wrappedNativeToken: Hex,
  lateFeeAmount: bigint | number = 0n,
  lateFeeTimeInterval: number | bigint = 0n,
): Promise<GetTransactionReceiptReturnType> => {
  await factory.write.addImplementation([type, invoice.address]);

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
      client,
      token,
      BigInt(deadline), // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      BigInt(lateFeeAmount),
      BigInt(lateFeeTimeInterval),
    ],
  );

  const hash = await factory.write.create([provider, amounts, data, type]);

  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

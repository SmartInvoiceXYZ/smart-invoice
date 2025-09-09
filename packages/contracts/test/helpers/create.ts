import { expect } from 'chai';
import { viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import {
  encodeAbiParameters,
  getAddress,
  GetContractReturnType,
  GetTransactionReceiptReturnType,
  Hex,
  parseAbi,
  parseEventLogs,
  zeroAddress,
  zeroHash,
} from 'viem';

import { ARBITRABLE_TYPE, ESCROW_TYPE } from './constants';
import { setBalanceOf } from './erc20';
import { encodeInitData } from './init';
import { nextSalt } from './salt';
import { currentTimestamp } from './timestamp';

export const awaitInvoiceAddress = async (
  receipt: GetTransactionReceiptReturnType,
): Promise<Hex | null> => {
  if (!receipt || !receipt.logs) return null;

  const abi = parseAbi([
    'event InvoiceCreated(uint256 indexed id, address indexed invoice, uint256[] amounts, bytes32 invoiceType, uint256 version)',
  ]);

  const logs = parseEventLogs({ abi, logs: receipt.logs });
  const event = logs.find(log => log.eventName === 'InvoiceCreated');

  if (event) {
    return getAddress(event.args.invoice);
  }
  return null;
};

export const createEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  implementation: GetContractReturnType,
  client: Hex,
  provider: Hex,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  terminationTime: number,
  details: string,
  requireVerification: boolean,
  feeBPS: bigint = 0n,
  treasury: Hex = zeroAddress,
): Promise<GetTransactionReceiptReturnType> => {
  await factory.write.addImplementation([ESCROW_TYPE, implementation.address]);

  // only address encoded as bytes32
  const resolverData = encodeAbiParameters(
    [{ type: 'address' }, { type: 'uint256' }],
    [resolver, 500n],
  );

  const data = encodeInitData({
    client,
    resolverData,
    token,
    terminationTime: BigInt(terminationTime),
    requireVerification,
    providerReceiver: zeroAddress, // no providerReceiver
    clientReceiver: zeroAddress, // no clientReceiver
    feeBPS,
    treasury,
    details,
  });

  const version = await factory.read.currentVersions([ESCROW_TYPE]);

  const hash = await factory.write.createDeterministic([
    provider,
    amounts,
    data,
    ESCROW_TYPE,
    version,
    nextSalt(),
  ]);

  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

export const createArbitrableEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  implementation: GetContractReturnType,
  client: Hex,
  provider: Hex,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  terminationTime: number,
  details: string,
  requireVerification: boolean,
  feeBPS: bigint = 0n,
  treasury: Hex = zeroAddress,
): Promise<GetTransactionReceiptReturnType> => {
  await factory.write.addImplementation([
    ARBITRABLE_TYPE,
    implementation.address,
  ]);

  const extraData = (zeroHash + zeroHash.slice(2)) as Hex;

  // only address encoded as bytes32
  const resolverData = encodeAbiParameters(
    [
      { name: 'resolver', type: 'address' },
      { name: 'extraData', type: 'bytes' },
    ],
    [resolver, extraData],
  );

  const data = encodeInitData({
    client,
    resolverData,
    token,
    terminationTime: BigInt(terminationTime),
    requireVerification,
    providerReceiver: zeroAddress, // no providerReceiver
    clientReceiver: zeroAddress, // no clientReceiver
    feeBPS,
    treasury,
    details,
  });

  const version = await factory.read.currentVersions([ARBITRABLE_TYPE]);

  const hash = await factory.write.createDeterministic([
    provider,
    amounts,
    data,
    ARBITRABLE_TYPE,
    version,
    nextSalt(),
  ]);

  return (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

export const getLockedEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  client: Hex,
  provider: Hex,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  details: string,
  mockWrappedETH: Hex,
  value = 0n,
  requireVerification: boolean = false,
): Promise<ContractTypesMap['SmartInvoiceEscrowPush']> => {
  const currentTime = await currentTimestamp();
  const newInvoice = await viem.deployContract('SmartInvoiceEscrowPush', [
    mockWrappedETH,
    factory.address,
  ]);

  const initReceipt = await createEscrow(
    factory,
    newInvoice,
    client,
    provider,
    resolver,
    token,
    amounts,
    currentTime + 1000,
    details,
    requireVerification,
  );

  const newInvoiceAddress = await awaitInvoiceAddress(initReceipt);
  if (!newInvoiceAddress) {
    throw new Error('Failed to get invoice address');
  }
  const lockedInvoice = await viem.getContractAt(
    'SmartInvoiceEscrowPush',
    newInvoiceAddress,
  );

  expect(await lockedInvoice.read.locked()).to.equal(false);

  await setBalanceOf(token, newInvoiceAddress, 10n);

  const lockHash = await lockedInvoice.write.lock([''], { value });

  const receipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({ hash: lockHash });

  const events = parseEventLogs({
    abi: parseAbi(['event Lock(address indexed client, string id)']),
    logs: receipt.logs,
  });

  expect(events[0].eventName).to.equal('Lock');
  expect(events[0].args.client).to.equal(getAddress(client));
  expect(events[0].args.id).to.equal('');

  return lockedInvoice;
};

export const getLockedArbitrableEscrow = async (
  factory: ContractTypesMap['SmartInvoiceFactory'],
  client: Hex,
  provider: Hex,
  resolver: Hex,
  token: Hex,
  amounts: bigint[],
  details: string,
  mockWrappedETH: Hex,
  value = 0n,
  requireVerification: boolean = false,
): Promise<ContractTypesMap['SmartInvoiceEscrowArbitrablePush']> => {
  const currentTime = await currentTimestamp();
  const newInvoice = await viem.deployContract(
    'SmartInvoiceEscrowArbitrablePush',
    [mockWrappedETH, factory.address],
  );

  const initReceipt = await createArbitrableEscrow(
    factory,
    newInvoice,
    client,
    provider,
    resolver,
    token,
    amounts,
    currentTime + 1000,
    details,
    requireVerification,
  );

  const newInvoiceAddress = await awaitInvoiceAddress(initReceipt);
  if (!newInvoiceAddress) {
    throw new Error('Failed to get invoice address');
  }
  const lockedInvoice = await viem.getContractAt(
    'SmartInvoiceEscrowArbitrablePush',
    newInvoiceAddress,
  );

  expect(await lockedInvoice.read.locked()).to.equal(false);

  await setBalanceOf(token, newInvoiceAddress, 10n);

  const lockHash = await lockedInvoice.write.lock([''], { value });

  const receipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({ hash: lockHash });

  const events = parseEventLogs({
    abi: parseAbi(['event Lock(address indexed client, string id)']),
    logs: receipt.logs,
  });

  expect(events[0].eventName).to.equal('Lock');
  expect(events[0].args.client).to.equal(getAddress(client));
  expect(events[0].args.id).to.equal('');

  return lockedInvoice;
};

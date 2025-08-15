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
  zeroAddress,
} from 'viem';

// Hardcoded constants for Sepolia testnet (chain ID 11155111)
export const SEPOLIA_CONTRACTS = {
  safeSingleton: '0xEdd160fEBBD92E350D4D398fb636302fccd67C7e' as Hex,
  safeFactory: '0x14F2982D601c9458F93bd70B218933A6f8165e7b' as Hex,
  splitMain: '0x54E4a6014D36c381fC43b7E24A1492F556139a6F' as Hex,
  fallbackHandler: '0x85a8ca358D388530ad0fB95D0cb89Dd44Fc242c3' as Hex,
  wrappedETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as Hex,
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// eslint-disable-next-line no-extend-native
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export type InitData = {
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

// Helper function to encode InitData struct
export const encodeInitData = (initData: InitData) => {
  return encodeAbiParameters(
    [
      {
        type: 'tuple',
        name: 'initData',
        components: [
          { name: 'client', type: 'address' },
          { name: 'resolverType', type: 'uint8' },
          { name: 'resolver', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'terminationTime', type: 'uint256' },
          { name: 'requireVerification', type: 'bool' },
          { name: 'providerReceiver', type: 'address' },
          { name: 'clientReceiver', type: 'address' },
          { name: 'feeBPS', type: 'uint256' },
          { name: 'treasury', type: 'address' },
          { name: 'details', type: 'string' },
        ],
      },
    ],
    [initData],
  );
};

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
  details: string,
  requireVerification: boolean,
  feeBPS: bigint = 0n,
  treasury: Hex = zeroAddress,
): Promise<GetTransactionReceiptReturnType> => {
  await factory.write.addImplementation([type, invoice.address]);

  // Create InitData struct for escrow setup
  const data = encodeAbiParameters(
    [
      {
        type: 'tuple',
        name: 'initData',
        components: [
          { name: 'client', type: 'address' },
          { name: 'resolverType', type: 'uint8' },
          { name: 'resolver', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'terminationTime', type: 'uint256' },
          { name: 'requireVerification', type: 'bool' },
          { name: 'providerReceiver', type: 'address' },
          { name: 'clientReceiver', type: 'address' },
          { name: 'feeBPS', type: 'uint256' },
          { name: 'treasury', type: 'address' },
          { name: 'details', type: 'string' },
        ],
      },
    ],
    [
      {
        client,
        resolverType,
        resolver,
        token,
        terminationTime: BigInt(terminationTime),
        requireVerification,
        providerReceiver: zeroAddress, // no providerReceiver
        clientReceiver: zeroAddress, // no clientReceiver
        feeBPS,
        treasury,
        details,
      },
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
  details: string,
  mockWrappedETH: Hex,
  value = 0n,
  requireVerification: boolean = false,
): Promise<ContractTypesMap['SmartInvoiceEscrow']> => {
  const currentTime = await currentTimestamp();
  const newInvoice = await viem.deployContract('SmartInvoiceEscrow', [
    mockWrappedETH,
    factory.address,
  ]);

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

import {
  SMART_INVOICE_ESCROW_ABI,
  SMART_INVOICE_FACTORY_ABI,
  SMART_INVOICE_INSTANT_ABI,
} from '@smart-invoice/constants';
import {
  Address,
  Chain,
  Hash,
  Hex,
  isAddress,
  isHex,
  WalletClient,
} from 'viem';

import { readContract, readEvent, writeContract } from './contracts';
import { getInvoiceFactoryAddress, logError } from './helpers';

export const sevenDaysFromNow = () => {
  const localDate = new Date();
  localDate.setDate(localDate.getDate() + 7);
  return localDate;
};

export const oneMonthFromNow = () => {
  const localDate = new Date();
  localDate.setDate(localDate.getDate() + 31);
  return localDate;
};

export const depositedMilestones = (deposited: bigint, amounts: number[]) => {
  let sum = BigInt(0);
  return amounts.map(a => {
    sum += BigInt(a);
    return deposited >= sum;
  });
};

export const register = async (
  address: Address,
  walletClient: WalletClient,
  recipient: Address,
  amounts: bigint[],
  data: Hex,
  type: Hex,
) => {
  if (!walletClient) throw new Error('Invalid wallet client');
  if (!walletClient.chain) throw new Error('Invalid chain');
  if (!isAddress(address)) throw new Error('Invalid address');
  if (!isAddress(recipient)) throw new Error('Invalid recipient');
  if (!Array.isArray(amounts)) throw new Error('Invalid amounts');
  if (!isHex(data)) throw new Error('Invalid data');
  if (!isHex(type)) throw new Error('Invalid type');

  return undefined;
  // return writeContract({
  //   abi: ISmartInvoiceFactoryAbi,
  //   address,
  //   walletClient,
  //   functionName: 'create',
  //   args: [recipient, amounts, data, type],
  // });
};

export const awaitInvoiceAddress = async (chainId: number, hash: Hash) => {
  // const receipt = await waitForTransaction({ chainId: chain.id, hash });
  const abi = SMART_INVOICE_FACTORY_ABI;

  // const [, address, , ,] = await readEvent({
  //   abi,
  //   chainId,
  //   hash,
  //   name: 'LogNewInvoice',
  // });
  // const eventFragment = abi.events[Object.keys(abi.events)[0]];
  // const eventTopic = abi.getEventTopic(eventFragment);
  // const event = receipt.logs.find((e) => e.topics[0] === eventTopic);
  // if (event) {
  //   const decodedLog = abi.decodeEventLog(
  //     eventFragment,
  //     event.data,
  //     event.topics,
  //   );
  //   return decodedLog.invoice;
  // }
  return undefined; // address;
};

export const getResolutionRateFromFactory = async (
  chain: Chain,
  resolver: Address,
  defaultValue: number = 20,
) => {
  if (!isAddress(resolver)) return defaultValue;
  try {
    // const address = getInvoiceFactoryAddress(chain.id);
    // const [resolutionRate] = await readContract({
    //   abi: ISmartInvoiceFactoryAbi,
    //   address,
    //   chain,
    //   functionName: 'resolutionRateOf',
    //   args: [resolver],
    // });
    // return resolutionRate > 0 ? Number(resolutionRate) : defaultValue;
    return defaultValue;
  } catch (resolutionRateError) {
    logError({ resolutionRateError });
    return defaultValue;
  }
};

// export const release = async (walletClient: WalletClient, address: Address) => {
//   if (!walletClient) throw new Error('Invalid wallet client');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');

//   return writeContract({
//     abi: ISmartInvoiceEscrowAbi,
//     address,
//     walletClient,
//     functionName: 'release',
//     args: [],
//   });
// };

// export const withdraw = async (
//   walletClient: WalletClient,
//   address: Address,
// ) => {
//   if (!walletClient) throw new Error('Invalid wallet client');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');

//   return writeContract({
//     abi: ISmartInvoiceEscrowAbi,
//     address,
//     walletClient,
//     functionName: 'withdraw',
//     args: [],
//   });
// };

// export const lock = async (
//   walletClient: WalletClient,
//   address: Address,
//   detailsHash: Hash, // 32 bits hex
// ) => {
//   if (!walletClient) throw new Error('Invalid wallet client');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');
//   if (!isHex(detailsHash)) throw new Error('Invalid details hash');

//   return writeContract({
//     abi: ISmartInvoiceEscrowAbi,
//     address,
//     walletClient,
//     functionName: 'lock',
//     args: [detailsHash],
//   });
// };

// export const resolve = async (
//   walletClient: WalletClient,
//   address: Address,
//   clientAward: any,
//   providerAward: any,
//   detailsHash: Hash, // 32 bits hex
// ) => {
//   if (!walletClient) throw new Error('Invalid wallet client');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');
//   if (!isHex(detailsHash)) throw new Error('Invalid details hash');

//   return writeContract({
//     abi: ISmartInvoiceEscrowAbi,
//     address,
//     walletClient,
//     functionName: 'resolve',
//     args: [clientAward, providerAward, detailsHash],
//   });
// };

// export const addMilestones = async (
//   walletClient: WalletClient,
//   address: Address,
//   amounts: bigint[],
// ) => {
//   if (!walletClient) throw new Error('Invalid wallet client');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');
//   if (!Array.isArray(amounts)) throw new Error('Invalid amounts');

//   return writeContract({
//     abi: ISmartInvoiceEscrowAbi,
//     address,
//     walletClient,
//     functionName: 'addMilestones',
//     args: [amounts],
//   });
// };

// export const addMilestonesWithDetails = async (
//   walletClient: WalletClient,
//   address: Address,
//   amounts: bigint[],
//   details: Hex,
// ) => {
//   if (!walletClient) throw new Error('Invalid wallet client');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');
//   if (!Array.isArray(amounts)) throw new Error('Invalid amounts');
//   if (!isHex(details)) throw new Error('Invalid details');

//   return writeContract({
//     abi: ISmartInvoiceEscrowAbi,
//     address,
//     walletClient,
//     functionName: 'addMilestones',
//     args: [amounts, details],
//   });
// };

// export const verify = async (walletClient: WalletClient, address: Address) => {
//   if (!walletClient) throw new Error('Invalid wallet client');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');

//   return writeContract({
//     abi: ISmartInvoiceEscrowAbi,
//     address,
//     walletClient,
//     functionName: 'verify',
//     args: [],
//   });
// };

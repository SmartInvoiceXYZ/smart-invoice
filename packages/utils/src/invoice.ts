/* eslint-disable @typescript-eslint/no-explicit-any */
import { SMART_INVOICE_FACTORY_ABI } from '@smart-invoice/constants';
// import { TokenBalance } from '@smart-invoice/graphql';
import _ from 'lodash';
import { Address, Chain, formatUnits, Hash, isAddress } from 'viem';

import { getInvoiceFactoryAddress, logError } from './helpers';

// TODO sort out Invoice/TokenBalance import

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

export const totalDeposited = (invoice: any, tokenBalance: any) => {
  const { released } = _.pick(invoice, ['released']);

  if (!released || !tokenBalance?.value) return undefined;
  return BigInt(released) + tokenBalance.value;
};

export const depositedMilestones = (invoice: any, tokenBalance: any) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  let sum = BigInt(0);
  return amounts.map((a: string) => {
    sum += BigInt(a);
    return totalDeposited(invoice, tokenBalance) >= sum;
  });
};

export const totalAmount = (invoice: any) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  return _.reduce(
    amounts,
    (sum, a) => {
      return sum + BigInt(a);
    },
    BigInt(0),
  );
};

export const totalDue = (invoice: any, tokenBalance: any) => {
  const { deposits, amounts } = _.pick(invoice, ['deposits', 'amounts']);

  if (!deposits || !amounts) return undefined;
  const localTotalDeposited = totalDeposited(invoice, tokenBalance);
  const total = totalAmount(invoice);
  return localTotalDeposited > total
    ? BigInt(0)
    : BigInt(total) - localTotalDeposited;
};

export const lastDispute = (invoice: any) => {
  const { isLocked, disputes } = _.pick(invoice, ['isLocked', 'disputes']);

  if (!isLocked || _.isEmpty(disputes)) return undefined;
  return disputes[_.size(disputes) - 1];
};

export const lastResolution = (invoice: any) => {
  const { isLocked, resolutions } = _.pick(invoice, [
    'isLocked',
    'resolutions',
  ]);

  if (!isLocked || _.isEmpty(resolutions)) return undefined;
  return resolutions[_.size(resolutions) - 1];
};

export const isInvoiceExpired = (invoice: any) => {
  const { terminationTime } = _.pick(invoice, ['terminationTime']);

  if (!terminationTime) return false;
  return terminationTime <= new Date().getTime() / 1000;
};

export const currentMilestoneAmount = (
  invoice: any,
  currentMilestone: number,
) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  if (Number(currentMilestone) < _.size(amounts)) {
    return amounts[Number(currentMilestone)];
  }
  return BigInt(0);
};

export const isMilestoneReleasable = (
  invoice: any,
  tokenBalance: any,
  currentMilestone: number,
) => {
  const { isLocked } = _.pick(invoice, ['isLocked']);
  const amount = currentMilestoneAmount(invoice, currentMilestone);

  if (!isLocked && amount && tokenBalance?.value) {
    return tokenBalance.value >= BigInt(amount) && BigInt(amount) > BigInt(0);
  }
  return false;
};

export const isLockable = (invoice: any, tokenBalance: any) => {
  const { isLocked, isExpired } = _.pick(invoice, ['isLocked', 'isExpired']);
  if (isLocked || isExpired) return false;

  return !isLocked && !isExpired && tokenBalance?.value > BigInt(0);
};

export const convertAmountsType = (invoice: any) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  return _.map(amounts, a => BigInt(a));
};

// Invoice, TokenMetadata
export const parseMilestoneAmounts = (invoice: any, tokenMetadata: any) => {
  const { amounts } = _.pick(invoice, ['amounts']);
  const { decimals } = tokenMetadata;

  return _.map(amounts, a => _.toNumber(formatUnits(BigInt(a), decimals)));
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
    const address = getInvoiceFactoryAddress(chain.id);
    // const [resolutionRate] = await readContract(client, {
    //   abi: SMART_INVOICE_FACTORY_ABI,
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

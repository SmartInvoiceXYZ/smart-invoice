/* eslint-disable @typescript-eslint/no-explicit-any */
import { SMART_INVOICE_FACTORY_ABI } from '@smart-invoice/constants';
// import { TokenBalance, InvoiceDetails } from '@smart-invoice/graphql';
import _ from 'lodash';
import { Address, Chain, formatUnits, Hash, isAddress } from 'viem';

import { getInvoiceFactoryAddress } from './helpers';
import { logError } from './log';

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
  return _.map(amounts, (a: string, i) => {
    sum += BigInt(a);
    return totalDeposited(invoice, tokenBalance) >= sum;
  });
};

export const depositedMilestonesString = (invoice: any, tokenBalance: any) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  let sum = BigInt(0);
  return _.map(amounts, (a: string, i: number) => {
    const prevAmount = amounts[i - 1] || BigInt(0);
    sum += BigInt(a);

    if (totalDeposited(invoice, tokenBalance) >= sum) {
      return 'deposited';
    }
    if (totalDeposited(invoice, tokenBalance) >= prevAmount) {
      return 'partially deposited';
    }
    return undefined;
  });
};

const findDepositForAmount = (amount: number, deposits: bigint[]) => {
  let sum = 0;
  return _.find(deposits, (deposit, i) => {
    if (!deposits) return undefined;
    sum += _.toNumber(deposits[i].toString());
    return deposit >= sum ? i : i - 1 || 0;
  });
};

/**
 * Match amounts to deposits
 * @param invoice
 * @param tokenBalance
 * @returns array of deposits
 */
export const assignDeposits = (invoice: any, tokenBalance: any) => {
  const { amounts, deposits } = _.pick(invoice, ['amounts', 'deposits']);

  let sum = BigInt(0);
  return _.map(amounts, (a: string, i: number) => {
    // sum of all amounts up to current index
    const localSum = _.sumBy(
      _.concat(_.slice(amounts, 0, i), [a]) as string[],
      v => _.toNumber(v.toString()),
    );
    // get deposit for matching amount
    console.log(localSum);
    const deposit = findDepositForAmount(localSum, deposits);
    console.log(deposit);

    sum += BigInt(a);
    return deposit; // deposit >= sum ? deposit : undefined;
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
  const localTotalDeposited = totalDeposited(invoice, tokenBalance);
  const total = totalAmount(invoice);

  if (!localTotalDeposited || !total) return undefined;
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InstantDetails,
  Invoice,
  InvoiceDetails,
  TokenBalance,
  TokenMetadata,
} from '@smart-invoice/graphql';
import _ from 'lodash';
import { formatUnits, Hex } from 'viem';

import {
  chainByName,
  convertByte32ToIpfsCidV0,
  getResolverFee,
  getResolverInfo,
  isKnownResolver,
  resolverFeeLabel,
} from '.';

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
  return _.map(amounts, (a: string) => {
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

const findDepositForAmount = (amount: number, deposits: any[]) => {
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
export const assignDeposits = (invoice: any) => {
  const { amounts, deposits } = _.pick(invoice, ['amounts', 'deposits']);

  return _.map(amounts, (a: string, i: number) => {
    // sum of all amounts up to current index
    const localSum = _.sumBy(
      _.concat(_.slice(amounts, 0, i), [a]) as string[],
      v => _.toNumber(v.toString()),
    );
    // get deposit for matching amount
    const deposit = findDepositForAmount(localSum, deposits);

    return deposit;
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

export const getInvoiceDetails = async (
  invoice: Invoice,
  tokenMetadata: TokenMetadata | undefined,
  tokenBalance: TokenBalance | undefined,
  nativeBalance: TokenBalance | undefined,
  instantDetails: InstantDetails | undefined,
): Promise<InvoiceDetails | null> => {
  if (!invoice || !tokenMetadata || !tokenBalance || !nativeBalance)
    return null;

  const chainId = chainByName(invoice?.network)?.id;

  // current milestone
  const currentMilestoneNumber = _.toNumber(
    _.get(invoice, 'currentMilestone')?.toString(),
  );
  const currentMilestoneAmountLabel = currentMilestoneAmount(
    invoice,
    currentMilestoneNumber,
  );

  // resolver
  const resolverInfo = getResolverInfo(invoice?.resolver as Hex, chainId);
  const resolverFee = getResolverFee(invoice, tokenBalance);

  try {
    const invoiceDetails = {
      ...invoice,
      // conversions
      currentMilestoneNumber,
      chainId,
      // computed values
      total: totalAmount(invoice),
      deposited: totalDeposited(invoice, tokenBalance),
      due: totalDue(invoice, tokenBalance),
      currentMilestoneAmount: currentMilestoneAmount(
        invoice,
        currentMilestoneNumber,
      ),
      currentMilestoneAmountDisplay: formatUnits(
        currentMilestoneAmountLabel,
        tokenMetadata?.decimals,
      ),
      bigintAmounts: convertAmountsType(invoice),
      parsedAmounts: parseMilestoneAmounts(invoice, tokenMetadata),
      depositedMilestones: depositedMilestones(invoice, tokenBalance),
      depositedMilestonesDisplay: depositedMilestonesString(
        invoice,
        tokenBalance,
      ),
      depositedTxs: assignDeposits(invoice),
      detailsHash: convertByte32ToIpfsCidV0(invoice?.details as Hex),
      resolverName: isKnownResolver(invoice?.resolver as Hex, chainId)
        ? resolverInfo?.name
        : invoice?.resolver,
      resolverInfo,
      resolverFee,
      resolverFeeDisplay: resolverFeeLabel(resolverFee, tokenMetadata),
      resolverAward: BigInt(0), // _.toNumber(formatUnits(balance / resolutionRate, 18)) : 0;
      // entities
      dispute: lastDispute(invoice),
      resolution: lastResolution(invoice),
      // flags
      isExpired: isInvoiceExpired(invoice),
      isReleasable: isMilestoneReleasable(
        invoice,
        tokenBalance,
        currentMilestoneNumber,
      ),
      isLockable: isLockable(invoice, tokenBalance),
      isWithdrawable:
        isInvoiceExpired(invoice) &&
        !!tokenBalance?.value &&
        tokenBalance?.value > BigInt(0),
      // token data
      tokenMetadata,
      tokenBalance,
      nativeBalance,
      ...instantDetails,
    };

    return invoiceDetails;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("Couldn't assemble InvoiceDetails", e);
    return null;
  }
};

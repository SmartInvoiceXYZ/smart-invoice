import {
  Deposit,
  Dispute,
  InstantDetails,
  Invoice,
  InvoiceDetails,
  Release,
  Resolution,
  TokenBalance,
  TokenMetadata,
} from '@smartinvoicexyz/graphql';
import _ from 'lodash';
import { formatUnits, Hex } from 'viem';

import { getDateString } from './date';
import {
  getResolverFee,
  getResolverInfo,
  isKnownResolver,
  resolverFeeLabel,
} from './helpers';
import { convertByte32ToIpfsCidV0 } from './ipfs';
import { chainByName } from './web3';

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

export const sevenDaysFromDate = (date: string | number | Date) => {
  const result = new Date(date);
  result.setDate(result.getDate() + 7);
  return result;
};

export const totalDeposited = (invoice: Invoice | undefined) => {
  const { deposits } = _.pick(invoice, ['deposits']);

  if (!deposits) return undefined;
  return deposits.reduce((sum, d) => {
    return sum + BigInt(d.amount.toString());
  }, BigInt(0));
};

export const depositedMilestones = (invoice: Invoice) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  let sum = BigInt(0);
  return _.map(amounts, (a: string) => {
    sum += BigInt(a);
    const amount = totalDeposited(invoice);
    if (!amount) return false;
    return amount >= sum;
  });
};

export const depositedMilestonesString = (invoice: Invoice) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  let sum = BigInt(0);
  return _.map(amounts, (a: bigint, i: number) => {
    const prevAmount = BigInt(amounts?.[i - 1] || 0) || BigInt(0);
    sum += BigInt(a);
    const deposited = totalDeposited(invoice);
    if (deposited && deposited >= sum) {
      return 'deposited';
    }
    if (deposited && deposited >= prevAmount) {
      return 'partially deposited';
    }
    return undefined;
  });
};

// [2, 2, 2]
// [4, 2]

// assuming possibly multiple milestones paid in one deposit,
// but not catching amounts paid over multiple deposits
const findDepositForAmount = (
  amount: bigint, // total amount to with milestones up to the current amount
  deposits: Deposit[] | undefined,
): Deposit | undefined => {
  if (!deposits) return undefined;

  let sum = 0n;
  return _.reverse(deposits).find((deposit, i) => {
    sum += BigInt(deposits[i].amount.toString());

    return sum >= amount ? deposit : deposits[i + 1];
  });
};

/**
 * Match amounts to deposits
 * @param invoice
 * @param tokenBalance
 * @returns array of deposits
 */
export const assignDeposits = (invoice: Invoice): (Deposit | undefined)[] => {
  const { amounts, deposits } = _.pick(invoice, ['amounts', 'deposits']);

  const depositedTxs =
    amounts?.map((_a, i) => {
      // sum of all amounts up to current index
      const sum =
        _.reduce(
          amounts?.slice(0, i + 1),
          (t, a) => {
            return t + BigInt(a);
          },
          BigInt(0),
        ) ?? BigInt(0);

      // get deposit for matching amount
      const deposit = findDepositForAmount(sum, deposits);

      return deposit;
    }) ?? [];

  return depositedTxs;
};

export const assignReleases = (invoice: Invoice): (Release | undefined)[] => {
  const { amounts, releases } = _.pick(invoice, ['amounts', 'releases']);

  const releasedTxs =
    amounts?.map((_a, i) => {
      const release = releases?.find(r => BigInt(r.milestone) === BigInt(i));

      return release;
    }) ?? [];

  return releasedTxs;
};

export const totalAmount = (invoice: Invoice) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  return _.reduce(
    amounts,
    (sum, a) => {
      return sum + BigInt(a);
    },
    BigInt(0),
  );
};

export const totalDue = (invoice: Invoice) => {
  const localTotalDeposited = totalDeposited(invoice);
  const total = totalAmount(invoice);

  if (!localTotalDeposited || !total) return undefined;
  return localTotalDeposited > total
    ? BigInt(0)
    : BigInt(total) - localTotalDeposited;
};

export const lastDispute = (invoice: Invoice) => {
  const { isLocked, disputes } = _.pick(invoice, ['isLocked', 'disputes']);

  if (!isLocked || _.isEmpty(disputes)) return undefined;
  return disputes?.[_.size(disputes) - 1] as Dispute;
};

export const lastResolution = (invoice: Invoice) => {
  const { isLocked, resolutions } = _.pick(invoice, [
    'isLocked',
    'resolutions',
  ]);

  if (!isLocked || _.isEmpty(resolutions)) return undefined;
  return resolutions?.[_.size(resolutions) - 1] as Resolution;
};

export const isInvoiceExpired = (invoice: Invoice) => {
  const { terminationTime } = _.pick(invoice, ['terminationTime']);

  if (!terminationTime) return false;
  return terminationTime <= new Date().getTime() / 1000;
};

export const currentMilestoneAmount = (
  invoice: Invoice,
  currentMilestone: number,
) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  if (Number(currentMilestone) < _.size(amounts)) {
    return BigInt(amounts?.[Number(currentMilestone)] || 0);
  }
  return BigInt(0);
};

export const isMilestoneReleasable = (
  invoice: Invoice,
  tokenBalance: TokenBalance,
  currentMilestone: number,
) => {
  const { isLocked } = _.pick(invoice, ['isLocked']);
  const amount = currentMilestoneAmount(invoice, currentMilestone);

  if (!isLocked && amount && tokenBalance?.value) {
    return tokenBalance.value >= BigInt(amount) && BigInt(amount) > BigInt(0);
  }
  return false;
};

export const isLockable = (invoice: Invoice, tokenBalance: TokenBalance) => {
  const { isLocked } = _.pick(invoice, ['isLocked']);
  if (isLocked || isInvoiceExpired(invoice)) return false;

  return (
    !isLocked && !isInvoiceExpired(invoice) && tokenBalance?.value > BigInt(0)
  );
};

export const convertAmountsType = (invoice: Invoice) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  return _.map(amounts, a => BigInt(a));
};

export const parseMilestoneAmounts = (
  invoice: Invoice,
  tokenMetadata: TokenMetadata,
) => {
  const { amounts } = _.pick(invoice, ['amounts']);
  const { decimals } = tokenMetadata;

  return _.map(amounts, a => _.toNumber(formatUnits(BigInt(a), decimals)));
};

const getDeadlineLabel = (
  instantDetails: InstantDetails | undefined,
  tokenBalance: TokenBalance,
) => {
  const { lateFee, lateFeeTimeInterval, deadline } = _.pick(instantDetails, [
    'lateFee',
    'lateFeeTimeInterval',
    'deadline',
  ]);

  if (!lateFee || !deadline || !lateFeeTimeInterval) return undefined;

  const daysPerInterval = lateFeeTimeInterval
    ? lateFeeTimeInterval / BigInt(1000 * 60 * 60 * 24)
    : undefined;

  return `${formatUnits(
    lateFee,
    tokenBalance?.decimals || 18,
  )} ${tokenBalance?.symbol} every ${daysPerInterval} day${
    daysPerInterval && daysPerInterval > 1 ? 's' : ''
  } after ${getDateString(_.toNumber(deadline?.toString()))}`;
};

export const getInvoiceDetails = async (
  invoice: Invoice | undefined,
  tokenMetadata: TokenMetadata | undefined,
  tokenBalance: TokenBalance | undefined,
  nativeBalance: TokenBalance | undefined,
  instantDetails: InstantDetails | undefined,
): Promise<InvoiceDetails | null> => {
  if (!invoice || !tokenMetadata || !tokenBalance || !nativeBalance) {
    return null;
  }

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
      deposited: totalDeposited(invoice),
      due: totalDue(invoice),
      // milestones
      currentMilestoneAmount: currentMilestoneAmount(
        invoice,
        currentMilestoneNumber,
      ),
      currentMilestoneAmountDisplay: formatUnits(
        currentMilestoneAmountLabel,
        tokenMetadata?.decimals,
      ),
      parsedAmounts: parseMilestoneAmounts(invoice, tokenMetadata),
      depositedMilestones: depositedMilestones(invoice),
      depositedMilestonesDisplay: depositedMilestonesString(invoice),
      depositedTxs: assignDeposits(invoice),
      releasedTxs: assignReleases(invoice),
      // details
      detailsHash: convertByte32ToIpfsCidV0(invoice?.details as Hex),
      // resolver
      resolverName: isKnownResolver(invoice?.resolver as Hex, chainId)
        ? resolverInfo?.name
        : invoice?.resolver,
      resolverInfo,
      resolverFee,
      resolverFeeDisplay: resolverFeeLabel(resolverFee, tokenMetadata),
      resolverAward: BigInt(0), // _.toNumber(formatUnits(balance / resolutionRate, 18)) : 0;
      // instant
      deadlineLabel: getDeadlineLabel(instantDetails, tokenBalance),
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
        tokenBalance.value > BigInt(0),
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

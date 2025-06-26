import {
  Deposit,
  Dispute,
  InstantDetails,
  Invoice,
  Release,
  Resolution,
  TokenBalance,
  TokenMetadata,
} from '@smartinvoicexyz/graphql';
import { logDebug } from '@smartinvoicexyz/shared';
import {
  InvoiceDetails,
  InvoiceMetadata,
  OldMetadata,
} from '@smartinvoicexyz/types';
import _ from 'lodash';
import { Address, formatUnits } from 'viem';

import { getDateString, parseToDate } from './date';
import {
  getResolverFee,
  getResolverInfo,
  getResolverInfoByAddress,
  resolverFeeLabel,
} from './helpers';
import { chainByName } from './web3';

const totalDeposited = (invoice: Invoice | undefined) => {
  const { deposits } = _.pick(invoice, ['deposits']);

  if (!deposits) return undefined;
  return deposits.reduce((sum, d) => {
    return sum + BigInt(d.amount.toString());
  }, BigInt(0));
};

const depositedMilestones = (invoice: Invoice) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  let sum = BigInt(0);
  return _.map(amounts, (a: string) => {
    sum += BigInt(a);
    const amount = totalDeposited(invoice);
    if (!amount) return false;
    return amount >= sum;
  });
};

const depositedMilestonesString = (invoice: Invoice) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  let sum = BigInt(0);
  return _.map(amounts, (a: bigint) => {
    const prevAmount = sum;
    sum += BigInt(a);
    const deposited = totalDeposited(invoice);
    if (deposited && deposited >= sum) {
      return 'deposited';
    }
    if (deposited && deposited > prevAmount) {
      return 'partially deposited';
    }
    return undefined;
  });
};

// assuming possibly multiple milestones paid in one deposit,
// but not catching amounts paid over multiple deposits
const findDepositForAmount = (
  amount: bigint, // total amount to with milestones up to the current amount
  deposits: Deposit[] | undefined,
): Deposit | undefined => {
  if (!deposits) return undefined;

  const depositsReversed = [...deposits].reverse();

  let sum = 0n;
  return depositsReversed.find((deposit, i) => {
    sum += deposit.amount;

    return sum >= amount || !depositsReversed[i + 1];
  });
};

/**
 * Match amounts to deposits
 * @param invoice
 * @param tokenBalance
 * @returns array of deposits
 */
const assignDeposits = (invoice: Invoice): (Deposit | undefined)[] => {
  const { amounts, deposits } = _.pick(invoice, ['amounts', 'deposits']);
  if (!amounts || !deposits) return [];

  const deposited = deposits.reduce((sum, d) => {
    return sum + d.amount;
  }, 0n);

  let sum = 0n;
  return _.map(amounts, (a: bigint) => {
    if (sum >= deposited) {
      return undefined;
    }
    sum += a;

    const deposit = findDepositForAmount(sum, deposits);
    return deposit;
  });
};

const assignReleases = (invoice: Invoice): (Release | undefined)[] => {
  const { amounts, releases } = _.pick(invoice, ['amounts', 'releases']);

  const releasedTxs =
    amounts?.map((_a, i) => {
      const release = releases?.find(r => BigInt(r.milestone) === BigInt(i));

      return release;
    }) ?? [];

  return releasedTxs;
};

const totalAmount = (invoice: Invoice) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  return _.reduce(
    amounts,
    (sum, a) => {
      return sum + BigInt(a);
    },
    BigInt(0),
  );
};

const totalDue = (invoice: Invoice) => {
  const localTotalDeposited = totalDeposited(invoice);
  const total = totalAmount(invoice);

  if (!localTotalDeposited || !total) return undefined;
  return localTotalDeposited > total
    ? BigInt(0)
    : BigInt(total) - localTotalDeposited;
};

const isInvoiceExpired = (invoice: Invoice) => {
  const { terminationTime } = _.pick(invoice, ['terminationTime']);

  if (!terminationTime) return false;
  return terminationTime <= new Date().getTime() / 1000;
};

const currentMilestoneAmount = (invoice: Invoice, currentMilestone: number) => {
  const { amounts } = _.pick(invoice, ['amounts']);

  if (Number(currentMilestone) < _.size(amounts)) {
    return BigInt(amounts?.[Number(currentMilestone)] || 0);
  }
  return BigInt(0);
};

const isMilestoneReleasable = (
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

const isLockable = (invoice: Invoice, tokenBalance: TokenBalance) => {
  const { isLocked } = _.pick(invoice, ['isLocked']);
  if (isLocked || isInvoiceExpired(invoice)) return false;

  return (
    !isLocked && !isInvoiceExpired(invoice) && tokenBalance?.value > BigInt(0)
  );
};

const parseMilestoneAmounts = (
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
  } after ${getDateString(parseToDate(deadline))}`;
};

const getDisputeAndResolution = (invoice: Invoice) => {
  const dispute = invoice?.disputes?.[0] as Dispute;
  const resolution = invoice?.resolutions?.[0] as Resolution;
  if (_.size(invoice?.disputes) > _.size(invoice?.resolutions)) {
    return { dispute, resolution: undefined };
  }

  return { dispute, resolution };
};

const convertOldMetadata = (
  oldMetadata: OldMetadata | undefined,
): InvoiceMetadata | undefined => {
  if (!oldMetadata) return undefined;

  const {
    projectName,
    title,
    projectDescription,
    description,
    projectAgreement,
    documents,
    startDate,
    endDate,
    ...metadata
  } = oldMetadata;

  const start = parseToDate(startDate);
  const end = parseToDate(endDate);

  return {
    ...metadata,
    title: title ?? projectName,
    description: description ?? projectDescription,
    documents: documents ?? projectAgreement,
    startDate: Math.floor(start.getTime() / 1000),
    endDate: Math.floor(end.getTime() / 1000),
  };
};

export const prepareExtendedInvoiceDetails = (
  invoice: Invoice | null | undefined,
  tokenMetadata: TokenMetadata | undefined,
  tokenBalance: TokenBalance | undefined,
  nativeBalance: TokenBalance | undefined,
  instantDetails: InstantDetails | undefined,
  invoiceMetadata: InvoiceMetadata | undefined,
): InvoiceDetails | null => {
  if (
    !invoice ||
    !tokenMetadata ||
    !tokenBalance ||
    !nativeBalance ||
    !invoiceMetadata
  ) {
    return null;
  }

  const { network, currentMilestone, resolver } = _.pick(invoice, [
    'resolver',
    'network',
    'currentMilestone',
  ]);

  const chainId = chainByName(network)?.id;

  // current milestone
  const currentMilestoneNumber = _.toNumber(currentMilestone?.toString());

  const currentMilestoneAmountLabel = currentMilestoneAmount(
    invoice,
    currentMilestoneNumber,
  );

  // resolver
  const resolverInfo =
    getResolverInfo(invoiceMetadata?.resolverType, chainId) ??
    getResolverInfoByAddress(resolver as Address, chainId);

  const resolverFee = getResolverFee(invoice, tokenBalance);

  const { dispute, resolution } = getDisputeAndResolution(invoice);

  try {
    const invoiceDetails = {
      ...invoice,
      chainId,
      // computed values
      total: totalAmount(invoice),
      deposited: totalDeposited(invoice),
      due: totalDue(invoice),
      // milestones
      currentMilestoneNumber,
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
      // resolver
      resolverInfo,
      resolverFee,
      resolverFeeDisplay: resolverFeeLabel(resolverFee, tokenMetadata),
      // instant
      deadlineLabel: getDeadlineLabel(instantDetails, tokenBalance),
      // dispute
      dispute,
      resolution,
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
      metadata: convertOldMetadata(invoiceMetadata),
    };

    logDebug({ invoiceDetails, address: invoice.address });

    return invoiceDetails;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("Couldn't assemble InvoiceDetails", e);
    return null;
  }
};

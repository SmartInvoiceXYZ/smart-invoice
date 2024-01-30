import { INVOICE_TYPES } from '@smart-invoice/constants';
import {
  fetchInvoice,
  InstantDetails,
  Invoice,
  InvoiceDetails,
  TokenBalance,
  TokenMetadata,
} from '@smart-invoice/graphql';
import {
  chainByName,
  convertAmountsType,
  convertByte32ToIpfsCidV0,
  currentMilestoneAmount,
  depositedMilestones,
  isInvoiceExpired,
  isLockable,
  isMilestoneReleasable,
  lastDispute,
  lastResolution,
  parseMilestoneAmounts,
  totalAmount,
  totalDeposited,
  totalDue,
} from '@smart-invoice/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Hex } from 'viem';
import { useBalance, useToken } from 'wagmi';

import { useInstantDetails } from '.';

const getInvoiceDetails = async (
  invoice: Invoice,
  tokenMetadata: TokenMetadata | undefined,
  tokenBalance: TokenBalance | undefined,
  nativeBalance: TokenBalance | undefined,
  instantDetails: InstantDetails | undefined,
): Promise<InvoiceDetails | null> => {
  const currentMilestoneNumber = _.toNumber(
    _.get(invoice, 'currentMilestone')?.toString(),
  );
  if (!invoice || !tokenMetadata || !tokenBalance || !nativeBalance)
    return null;

  // TODO change any of these if instantDetails?

  try {
    const invoiceDetails = {
      ...invoice,
      // conversions
      currentMilestoneNumber,
      chainId: chainByName(invoice?.network)?.id,
      // computed values
      total: totalAmount(invoice),
      deposited: totalDeposited(invoice, tokenBalance),
      due: totalDue(invoice, tokenBalance),
      currentMilestoneAmount: currentMilestoneAmount(
        invoice,
        currentMilestoneNumber,
      ),
      bigintAmounts: convertAmountsType(invoice),
      parsedAmounts: parseMilestoneAmounts(invoice, tokenMetadata),
      depositedMilestones: depositedMilestones(invoice, tokenBalance),
      detailsHash: convertByte32ToIpfsCidV0(invoice?.details as Hex),
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

export const useInvoiceDetails = ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery<Invoice>({
    queryKey: ['invoiceDetails', { address, chainId }],
    queryFn: () => fetchInvoice(chainId, address),
    enabled: !!address && !!chainId,
    staleTime: 1000 * 60 * 15,
  });

  const { invoiceType: type } = _.pick(invoice, ['invoiceType']);

  // fetch data about the invoice's token
  const { data: tokenMetadata } = useToken({
    address: invoice?.token as Hex,
    chainId,
    enabled: !!address && !!chainId,
  });

  // fetch the invoice's balances
  const { data: nativeBalance } = useBalance({ address });
  const { data: tokenBalance } = useBalance({
    address,
    token: invoice?.token as Hex,
    chainId,
    enabled: !!invoice?.token && !!chainId,
  });

  // fetch the invoice's instant details, if applicable
  const { data: instantDetails } = useInstantDetails({
    address,
    chainId,
    enabled: !!address && !!chainId && type === INVOICE_TYPES.Instant,
  });

  // enhance the invoice with computed values
  const { data: invoiceDetails, isLoading: isInvoiceDetailsLoading } =
    useQuery<InvoiceDetails | null>({
      queryKey: [
        'extendedInvoiceDetails',
        {
          invoiceId: _.get(invoice, 'id'),
          token: tokenMetadata?.name,
          tokenBalance: tokenBalance?.formatted,
          nativeBalance: nativeBalance?.formatted,
          instantDetails: _.mapValues(instantDetails, v => v?.toString()),
        },
      ],
      queryFn: () =>
        getInvoiceDetails(
          invoice,
          tokenMetadata,
          tokenBalance,
          nativeBalance,
          instantDetails,
        ),
      enabled:
        !!address &&
        !!chainId &&
        !!tokenMetadata &&
        !!tokenBalance &&
        !!nativeBalance &&
        type === INVOICE_TYPES.Instant
          ? !!instantDetails
          : true,

      staleTime: 1000 * 60 * 15,
    });

  return {
    data: invoice,
    invoiceDetails,
    isLoading: isLoading || isInvoiceDetailsLoading,
    error,
  };
};

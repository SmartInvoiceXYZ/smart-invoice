import {
  fetchInvoice,
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

const getInvoiceDetailsDetails = async (
  invoice: Invoice,
  tokenMetadata: TokenMetadata | undefined,
  tokenBalance: TokenBalance | undefined,
  nativeBalance: TokenBalance | undefined,
): Promise<InvoiceDetails | undefined> => {
  const currentMilestoneNumber = _.toNumber(
    _.get(invoice, 'currentMilestone')?.toString(),
  );
  if (!invoice || !tokenMetadata || !tokenBalance) return undefined;

  const invoiceDetails = {
    ...invoice,
    // conversions
    currentMilestoneNumber,
    chainId: chainByName(invoice?.network)?.id,
    // computed values
    total: totalAmount(invoice),
    deposited: totalDeposited(invoice),
    due: totalDue(invoice),
    currentMilestoneAmount: currentMilestoneAmount(
      invoice,
      currentMilestoneNumber,
    ),
    bigintAmounts: convertAmountsType(invoice),
    parsedAmounts: parseMilestoneAmounts(invoice, tokenMetadata),
    depositedMilestones: depositedMilestones(invoice),
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
  };

  return invoiceDetails;
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

  const { data: tokenMetadata } = useToken({
    address: invoice?.token as Hex,
    chainId,
    enabled: !!address && !!chainId,
  });

  const { data: nativeBalance } = useBalance({ address });
  const { data: tokenBalance } = useBalance({
    address,
    token: invoice?.token as Hex,
    chainId,
    enabled: !!invoice?.token && !!chainId,
  });

  const { data: invoiceDetails, isLoading: isInvoiceDetailsLoading } = useQuery<
    InvoiceDetails | undefined
  >({
    queryKey: [
      'extendedInvoiceDetails',
      {
        invoiceId: _.get(invoice, 'id'),
        token: tokenMetadata?.name,
        tokenBalance: tokenBalance?.formatted,
        nativeBalance: nativeBalance?.formatted,
      },
    ],
    queryFn: () =>
      getInvoiceDetailsDetails(
        invoice,
        tokenMetadata,
        tokenBalance,
        nativeBalance,
      ),
    enabled: !!address && !!chainId,
    staleTime: 1000 * 60 * 15,
  });

  return {
    data: invoice,
    invoiceDetails,
    isLoading: isLoading || isInvoiceDetailsLoading,
    error,
  };
};

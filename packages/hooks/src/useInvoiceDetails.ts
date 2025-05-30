import { INVOICE_TYPES } from '@smartinvoicexyz/constants';
import { fetchInvoice, Invoice } from '@smartinvoicexyz/graphql';
import { InvoiceDetails, InvoiceMetadata } from '@smartinvoicexyz/types';
import { getInvoiceDetails } from '@smartinvoicexyz/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { formatUnits, Hex } from 'viem';
import { useBalance } from 'wagmi';

import { useInstantDetails } from './useInstantDetails';
import { useIpfsDetails } from './useIpfsDetails';
import { useTokenData } from './useTokenMetadata';

export const QUERY_KEY_INVOICE_DETAILS = 'invoiceDetails';
export const QUERY_KEY_EXTENDED_INVOICE_DETAILS = 'extendedInvoiceDetails';

export const useInvoiceDetails = ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number | undefined;
}): {
  invoiceDetails: InvoiceDetails;
  isLoading: boolean;
  error: Error | null;
} => {
  const queryClient = useQueryClient();

  const {
    data: invoice,
    isLoading: isFetchingInvoice,
    error,
  } = useQuery<Invoice | null>({
    queryKey: [QUERY_KEY_INVOICE_DETAILS, { address, chainId }],
    queryFn: () => fetchInvoice(chainId, address),
    enabled: !!address && !!chainId,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  // Manually trigger refetch of extended invoice details when invoice is fetched
  useEffect(() => {
    if (!isFetchingInvoice) {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_EXTENDED_INVOICE_DETAILS],
      });
    }
  }, [isFetchingInvoice, queryClient]);

  const { invoiceType, token, ipfsHash } = _.pick(invoice, [
    'invoiceType',
    'token',
    'ipfsHash',
  ]);

  // fetch data about the invoice's token
  const {
    metadata: tokenMetadata,
    balance: tokenBalance,
    isLoading: isLoadingTokenData,
  } = useTokenData({
    address,
    tokenAddress: token as Hex,
    chainId,
  });

  // fetch the invoice's balances
  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useBalance(
    {
      address,
      chainId,
    },
  );

  // fetch the invoice's instant details, if applicable
  const { data: instantDetails, isLoading: isLoadingInstantDetails } =
    useInstantDetails({
      address,
      chainId,
      enabled: !!address && !!chainId && invoiceType === INVOICE_TYPES.Instant,
    });

  // fetch invoice details from Ipfs
  const { data: ipfsDetails, isLoading: isLoadingIpfs } =
    useIpfsDetails(ipfsHash);

  const getInvoiceDetailsEnabled =
    !!invoice &&
    !!tokenMetadata &&
    !!tokenBalance &&
    !!nativeBalance &&
    !!ipfsDetails &&
    !isFetchingInvoice &&
    (invoiceType === INVOICE_TYPES.Instant ? !!instantDetails : true);

  // enhance the invoice with assorted computed values
  const { data: invoiceDetails, isLoading: isInvoiceDetailsLoading } =
    useQuery<InvoiceDetails | null>({
      queryKey: [
        QUERY_KEY_EXTENDED_INVOICE_DETAILS,
        {
          invoiceId: _.get(invoice, 'id'),
          token: tokenMetadata?.name,
          tokenBalance: tokenBalance
            ? formatUnits(tokenBalance.value, tokenBalance.decimals)
            : undefined,
          nativeBalance: nativeBalance
            ? formatUnits(nativeBalance.value, nativeBalance.decimals)
            : undefined,
          instantDetails: _.mapValues(instantDetails, v => v?.toString()),
          ipfsDetails: JSON.stringify(ipfsDetails),
        },
      ],
      queryFn: () =>
        getInvoiceDetails(
          invoice,
          tokenMetadata,
          tokenBalance,
          nativeBalance,
          instantDetails,
          ipfsDetails as InvoiceMetadata,
        ),
      enabled: getInvoiceDetailsEnabled,
      refetchInterval: 60000,
      refetchOnWindowFocus: false,
    });

  const isLoading = useMemo(
    () =>
      isFetchingInvoice ||
      isLoadingTokenData ||
      isLoadingNativeBalance ||
      isLoadingInstantDetails ||
      isLoadingIpfs ||
      isInvoiceDetailsLoading,
    [
      isFetchingInvoice,
      isLoadingTokenData,
      isLoadingNativeBalance,
      isLoadingInstantDetails,
      isLoadingIpfs,
      isInvoiceDetailsLoading,
    ],
  );

  return {
    invoiceDetails: invoiceDetails ?? {},
    isLoading,
    error,
  };
};

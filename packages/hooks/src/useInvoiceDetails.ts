import { INVOICE_TYPES } from '@smartinvoicexyz/constants';
import {
  fetchInvoice,
  Invoice,
  TokenBalance,
  TokenMetadata,
} from '@smartinvoicexyz/graphql';
import { InvoiceDetails, InvoiceMetadata } from '@smartinvoicexyz/types';
import { fetchFromIPFS, getInvoiceDetails } from '@smartinvoicexyz/utils';
import {
  QueryClient,
  QueryKey,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { Hex } from 'viem';
import { useBalance } from 'wagmi';

import {
  fetchInstantInvoice,
  fetchNativeBalance,
  fetchTokenData,
} from './server/invoice';
import { useInstantDetails } from './useInstantDetails';
import { useIpfsDetails } from './useIpfsDetails';
import { useTokenData } from './useTokenMetadata';

export const QUERY_KEY_INVOICE_DETAILS = 'invoiceDetails';
export const QUERY_KEY_EXTENDED_INVOICE_DETAILS = 'extendedInvoiceDetails';

// Helper function to convert bigint values to strings for serialization
const serializeBigInts = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null; // Convert undefined to null for JSON serialization
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts);
  }

  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([key, value]) => [key, serializeBigInts(value)])
        .filter(([, value]) => value !== undefined),
    );
  }

  return obj;
};

type SerializedQuery = {
  queryKey: QueryKey;
  state: {
    data: unknown;
    dataUpdateCount: number;
    dataUpdatedAt: number;
    error: Error | null;
    errorUpdateCount: number;
    errorUpdatedAt: number;
    fetchFailureCount: number;
    fetchFailureReason: Error | null;
    fetchMeta: unknown;
    isInvalidated: boolean;
    status: string;
    fetchStatus: string;
  };
};

// Server-side prefetch function
export const prefetchInvoiceDetails = async (
  queryClient: QueryClient,
  address: Hex,
  chainId: number,
): Promise<SerializedQuery[] | null> => {
  // Prefetch the raw invoice
  await queryClient.prefetchQuery({
    queryKey: [QUERY_KEY_INVOICE_DETAILS, { address, chainId }],
    queryFn: () => fetchInvoice(chainId, address),
  });

  // Get the invoice data from the cache
  const invoice = queryClient.getQueryData<Invoice>([
    QUERY_KEY_INVOICE_DETAILS,
    { address, chainId },
  ]);

  if (!invoice) {
    return null;
  }

  const { invoiceType, token, ipfsHash } = _.pick(invoice, [
    'address',
    'invoiceType',
    'token',
    'ipfsHash',
  ]);

  // Prefetch token metadata and balance
  if (token) {
    await queryClient.prefetchQuery({
      queryKey: ['tokenMetadata', { address, tokenAddress: token, chainId }],
      queryFn: () => fetchTokenData(address, token as Hex, chainId),
    });
  }

  // Prefetch IPFS details
  if (ipfsHash) {
    await queryClient.prefetchQuery({
      queryKey: ['ipfsDetails', ipfsHash],
      queryFn: () => fetchFromIPFS(ipfsHash),
    });
  }

  if (invoiceType && invoiceType === INVOICE_TYPES.Instant) {
    await queryClient.prefetchQuery({
      queryKey: ['instantDetails', { address, chainId }],
      queryFn: () => fetchInstantInvoice(address, chainId),
    });
  }

  // Prefetch native balance
  await queryClient.prefetchQuery({
    queryKey: ['balance', { address, chainId }],
    queryFn: () => fetchNativeBalance(address, chainId),
  });

  // Prefetch extended invoice details
  const cachedTokenData = queryClient.getQueryData<{
    metadata: TokenMetadata;
    balance: TokenBalance;
  }>(['tokenMetadata', { address, tokenAddress: token, chainId }]);

  const cachedIpfsDetails = queryClient.getQueryData<InvoiceMetadata>([
    'ipfsDetails',
    ipfsHash,
  ]);

  const cachedInstantDetails = queryClient.getQueryData<{
    totalDue: bigint;
    amountFulfilled: bigint;
    fulfilled: boolean;
    deadline: bigint;
    lateFee: bigint;
    lateFeeTimeInterval: bigint;
  }>(['instantDetails', { address, chainId }]);

  const cachedNativeBalance = queryClient.getQueryData<TokenBalance>([
    'balance',
    { address, chainId },
  ]);

  if (
    cachedTokenData &&
    cachedIpfsDetails &&
    cachedNativeBalance &&
    (invoiceType !== INVOICE_TYPES.Instant || cachedInstantDetails)
  ) {
    await queryClient.prefetchQuery({
      queryKey: [QUERY_KEY_EXTENDED_INVOICE_DETAILS, { invoiceId: invoice.id }],
      queryFn: () =>
        getInvoiceDetails(
          invoice,
          cachedTokenData.metadata,
          cachedTokenData.balance,
          cachedNativeBalance,
          cachedInstantDetails,
          cachedIpfsDetails,
        ),
    });
  }

  // Get all queries from the cache and serialize bigint values
  const queries = queryClient.getQueryCache().getAll();
  const serializedQueries = queries.map(query => ({
    queryKey: query.queryKey,
    state: {
      ...query.state,
      data: serializeBigInts(query.state.data),
      error: query.state.error ? serializeBigInts(query.state.error) : null,
    },
  }));

  return serializedQueries;
};

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

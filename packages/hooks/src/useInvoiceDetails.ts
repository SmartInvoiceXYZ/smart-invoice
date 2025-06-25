import { INVOICE_TYPES } from '@smartinvoicexyz/constants';
import { fetchInvoice, Invoice } from '@smartinvoicexyz/graphql';
import { InvoiceDetails, InvoiceMetadata } from '@smartinvoicexyz/types';
import {
  fetchFromIPFS,
  prepareExtendedInvoiceDetails,
  serverConfig,
} from '@smartinvoicexyz/utils';
import {
  dehydrate,
  DehydratedState,
  QueryClient,
  QueryKey,
  useQuery,
} from '@tanstack/react-query';
import { getBalance } from '@wagmi/core';
import { getBalanceQueryKey, hashFn } from '@wagmi/core/query';
import _ from 'lodash';
import { useMemo } from 'react';
import { Hex } from 'viem';
import { useBalance } from 'wagmi';

import {
  fetchInstantInvoice,
  fetchTokenBalance,
  fetchTokenMetadata,
} from './helpers';
import {
  createInstantDetailsQueryKey,
  useInstantDetails,
} from './useInstantDetails';
import { createIpfsDetailsQueryKey, useIpfsDetails } from './useIpfsDetails';
import { createTokenBalanceQueryKey } from './useTokenBalance';
import { useTokenData } from './useTokenData';
import { createTokenMetadataQueryKey } from './useTokenMetadata';

const QUERY_KEY_INVOICE_DETAILS = 'invoiceDetails';

export const createInvoiceDetailsQueryKey = (
  chainId: number | undefined,
  address: Hex | undefined,
): QueryKey => [QUERY_KEY_INVOICE_DETAILS, { chainId, address }];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Server-side prefetch function
export const prefetchInvoiceDetails = async (
  address: Hex,
  chainId: number,
): Promise<undefined | DehydratedState> => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: hashFn,
      },
    },
  });
  const invoice = await fetchInvoice(chainId, address);
  if (!invoice) {
    return undefined;
  }
  // Prefetch the raw invoice
  await queryClient.prefetchQuery({
    queryKey: createInvoiceDetailsQueryKey(chainId, address),
    queryFn: () => invoice,
  });

  const { invoiceType, token, ipfsHash } = _.pick(invoice, [
    'address',
    'invoiceType',
    'token',
    'ipfsHash',
  ]);

  const tokenAddress = token as Hex;

  // Prefetch token metadata and balance
  if (tokenAddress) {
    await queryClient.prefetchQuery({
      queryKey: createTokenMetadataQueryKey({ tokenAddress, chainId }),
      queryFn: () => fetchTokenMetadata(serverConfig, tokenAddress, chainId),
    });
    await queryClient.prefetchQuery({
      queryKey: createTokenBalanceQueryKey({ address, tokenAddress, chainId }),
      queryFn: () =>
        fetchTokenBalance(serverConfig, address, tokenAddress, chainId),
    });
  }

  // Prefetch IPFS details
  if (ipfsHash) {
    await queryClient.prefetchQuery({
      queryKey: createIpfsDetailsQueryKey(ipfsHash),
      queryFn: () => fetchFromIPFS(ipfsHash),
    });
  }

  if (invoiceType && invoiceType === INVOICE_TYPES.Instant) {
    await queryClient.prefetchQuery({
      queryKey: createInstantDetailsQueryKey({ address, chainId }),
      queryFn: () => fetchInstantInvoice(serverConfig, address, chainId),
    });
  }

  // Prefetch native balance
  await queryClient.prefetchQuery({
    queryKey: getBalanceQueryKey({ address, chainId }),
    queryFn: () => getBalance(serverConfig, { address, chainId }),
  });

  return dehydrate(queryClient, {
    serializeData: serializeBigInts,
  });
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
  const {
    data: invoice,
    isLoading: isFetchingInvoice,
    error,
  } = useQuery<Invoice | null>({
    queryKey: createInvoiceDetailsQueryKey(chainId, address),
    queryFn: () => fetchInvoice(chainId, address),
    enabled: !!address && !!chainId,
  });

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
    tokenAddress: token as Hex | undefined,
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

  // enhance the invoice with assorted computed values
  const invoiceDetails = useMemo(
    () =>
      prepareExtendedInvoiceDetails(
        invoice,
        tokenMetadata,
        tokenBalance,
        nativeBalance,
        instantDetails,
        ipfsDetails as InvoiceMetadata,
      ),
    [
      invoice,
      tokenMetadata,
      tokenBalance,
      nativeBalance,
      instantDetails,
      ipfsDetails,
    ],
  );

  const isLoading = useMemo(
    () =>
      isFetchingInvoice ||
      isLoadingTokenData ||
      isLoadingNativeBalance ||
      isLoadingInstantDetails ||
      isLoadingIpfs,
    [
      isFetchingInvoice,
      isLoadingTokenData,
      isLoadingNativeBalance,
      isLoadingInstantDetails,
      isLoadingIpfs,
    ],
  );

  return {
    invoiceDetails: invoiceDetails ?? {},
    isLoading,
    error,
  };
};

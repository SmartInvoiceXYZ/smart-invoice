import { INVOICE_TYPES } from '@smartinvoicexyz/constants';
import { fetchInvoice } from '@smartinvoicexyz/graphql';
import { serverConfig } from '@smartinvoicexyz/utils';
import { fetchFromIPFS } from '@smartinvoicexyz/utils/src/ipfs/fetchFromIPFS';
import { dehydrate, DehydratedState, QueryClient } from '@tanstack/react-query';
import { getBalance } from '@wagmi/core';
import { getBalanceQueryKey, hashFn } from '@wagmi/core/query';
import { Hex } from 'viem';

import {
  fetchInstantInvoice,
  fetchTokenBalance,
  fetchTokenMetadata,
} from './helpers';
import { createInstantDetailsQueryKey } from './useInstantDetails';
import { createIpfsDetailsQueryKey } from './useIpfsDetails';
import { createTokenBalanceQueryKey } from './useTokenBalance';
import { createTokenMetadataQueryKey } from './useTokenMetadata';

const QUERY_KEY_INVOICE_DETAILS = 'invoiceDetails';

export const createInvoiceDetailsQueryKey = (
  chainId: number | undefined,
  address: Hex | undefined,
) => [QUERY_KEY_INVOICE_DETAILS, { chainId, address }];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeBigInts = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
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

// Server-side prefetch function with minimal imports
export const prefetchInvoiceDetails = async (
  address: Hex,
  chainId: number,
): Promise<DehydratedState | null> => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: hashFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 0, // No retries in serverless to prevent file handle buildup
      },
    },
  });

  try {
    const invoice = await fetchInvoice(chainId, address);
    if (!invoice) {
      return null;
    }

    // Prefetch the raw invoice
    await queryClient.prefetchQuery({
      queryKey: createInvoiceDetailsQueryKey(chainId, address),
      queryFn: () => invoice,
    });

    const { invoiceType, token, ipfsHash } = invoice;
    const tokenAddress = token as Hex;

    // Sequential prefetching to avoid too many open connections
    try {
      // Fetch token metadata and balance
      if (tokenAddress) {
        try {
          const tokenMetadata = await fetchTokenMetadata(
            serverConfig,
            tokenAddress,
            chainId,
          );
          await queryClient.prefetchQuery({
            queryKey: createTokenMetadataQueryKey({ tokenAddress, chainId }),
            queryFn: () => tokenMetadata,
          });
        } catch (tokenMetadataError) {
          console.error('Token metadata prefetch failed:', tokenMetadataError);
        }

        try {
          const tokenBalance = await fetchTokenBalance(
            serverConfig,
            address,
            tokenAddress,
            chainId,
          );
          await queryClient.prefetchQuery({
            queryKey: createTokenBalanceQueryKey({
              address,
              tokenAddress,
              chainId,
            }),
            queryFn: () => tokenBalance,
          });
        } catch (tokenBalanceError) {
          console.error('Token balance prefetch failed:', tokenBalanceError);
        }
      }

      // Fetch IPFS details
      if (ipfsHash) {
        try {
          const ipfsDetails = await fetchFromIPFS(ipfsHash, true);
          await queryClient.prefetchQuery({
            queryKey: createIpfsDetailsQueryKey(ipfsHash),
            queryFn: () => ipfsDetails,
          });
        } catch (ipfsError) {
          console.error('IPFS prefetch failed:', ipfsError);
        }
      }

      // Fetch instant details
      if (invoiceType && invoiceType === INVOICE_TYPES.Instant) {
        try {
          const instantDetails = await fetchInstantInvoice(
            serverConfig,
            address,
            chainId,
          );
          await queryClient.prefetchQuery({
            queryKey: createInstantDetailsQueryKey({ address, chainId }),
            queryFn: () => instantDetails,
          });
        } catch (instantError) {
          console.error('Instant details prefetch failed:', instantError);
        }
      }

      // Fetch native balance
      try {
        const nativeBalance = await getBalance(serverConfig, {
          address,
          chainId,
        });
        await queryClient.prefetchQuery({
          queryKey: getBalanceQueryKey({ address, chainId }),
          queryFn: () => nativeBalance,
        });
      } catch (balanceError) {
        console.error('Native balance prefetch failed:', balanceError);
      }
    } catch (prefetchError) {
      console.error('Some prefetch operations failed:', prefetchError);
    }

    return dehydrate(queryClient, {
      serializeData: serializeBigInts,
    });
  } catch (error) {
    console.error(
      'Prefetch Invoice Details failed, falling back to client-side:',
      error,
    );
    return null;
  }
};

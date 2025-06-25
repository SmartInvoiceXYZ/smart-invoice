import { TokenMetadata } from '@smartinvoicexyz/graphql';
import { useQuery } from '@tanstack/react-query';
import { type QueryKey } from '@tanstack/react-query';
import _ from 'lodash';
import { Hex } from 'viem';
import { useConfig } from 'wagmi';

import { fetchTokenMetadata } from './helpers';

export const createTokenMetadataQueryKey = ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex | undefined;
  chainId: number | undefined;
}) => ['tokenMetadata', { tokenAddress, chainId }] as QueryKey;

export const useTokenMetadata = ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex | undefined;
  chainId: number | undefined;
}): {
  data: TokenMetadata | undefined;
  error: Error | null;
  isLoading: boolean;
  isPending: boolean;
} => {
  const config = useConfig();
  const result = useQuery({
    enabled: !!tokenAddress && !!chainId,
    staleTime: Infinity, // cache forever
    gcTime: Infinity, // never garbage collect
    refetchInterval: false,
    queryKey: createTokenMetadataQueryKey({ tokenAddress, chainId }),
    queryFn: () => fetchTokenMetadata(config, tokenAddress, chainId),
  });

  return {
    ...result,
    data: result.data
      ? ({
          address: tokenAddress as Hex,
          decimals: Number(result.data[0]),
          name: result.data[1],
          symbol: result.data[2],
        } as TokenMetadata)
      : undefined,
  };
};

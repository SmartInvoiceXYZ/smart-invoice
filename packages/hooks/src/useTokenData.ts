import { TokenBalance, TokenMetadata } from '@smartinvoicexyz/graphql';
import _ from 'lodash';
import { Hex } from 'viem';

import { useTokenBalance } from './useTokenBalance';
import { useTokenMetadata } from './useTokenMetadata';

type UseTokenDataProps = {
  address: Hex | undefined;
  tokenAddress: Hex | undefined;
  chainId: number | undefined;
};

export const useTokenData = ({
  address,
  tokenAddress,
  chainId,
}: UseTokenDataProps): {
  metadata: TokenMetadata | undefined;
  balance: TokenBalance | undefined;
  error: unknown;
  isLoading: boolean;
  isPending: boolean;
} => {
  const metadataResult = useTokenMetadata({
    tokenAddress,
    chainId,
  });

  const balanceResult = useTokenBalance({
    address,
    tokenAddress,
    chainId,
  });

  const metadata = metadataResult.data;

  const balance =
    metadata && balanceResult.data !== undefined
      ? {
          decimals: metadata.decimals,
          symbol: metadata.symbol,
          value: balanceResult.data,
        }
      : undefined;

  return {
    metadata,
    balance,
    error: metadataResult.error ?? balanceResult.error ?? null,
    isLoading: metadataResult.isLoading || balanceResult.isLoading,
    isPending: metadataResult.isPending || balanceResult.isPending,
  };
};

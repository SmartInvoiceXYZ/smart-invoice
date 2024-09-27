import { TokenBalance, TokenMetadata } from '@smartinvoicexyz/graphql';
import _ from 'lodash';
import { erc20Abi, Hex, MulticallErrorType, ReadContractErrorType } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

export const useTokenMetadata = ({
  address,
  chainId,
}: {
  address: Hex | undefined;
  chainId: number | undefined;
}): {
  data: TokenMetadata | undefined;
  error: MulticallErrorType | ReadContractErrorType | null;
  isLoading: boolean;
  isPending: boolean;
} => {
  const result = useReadContracts({
    allowFailure: false,
    query: {
      enabled: !!address && !!chainId,
      refetchInterval: false,
    },
    contracts: [
      {
        address,
        chainId,
        abi: erc20Abi,
        functionName: 'decimals',
      },
      {
        address,
        chainId,
        abi: erc20Abi,
        functionName: 'name',
      },
      {
        address,
        chainId,
        abi: erc20Abi,
        functionName: 'symbol',
      },
      {
        address,
        chainId,
        abi: erc20Abi,
        functionName: 'totalSupply',
      },
    ],
  });

  return {
    ...result,
    data: result.data
      ? ({
          address: address as Hex,
          decimals: Number(result.data[0]),
          name: result.data[1],
          symbol: result.data[2],
          totalSupply: result.data[3],
        } as TokenMetadata)
      : undefined,
  };
};

export const useTokenBalance = ({
  tokenAddress,
  address,
  chainId,
}: {
  tokenAddress: Hex | undefined;
  address: Hex;
  chainId: number | undefined;
}): {
  data: bigint | undefined;
  error: ReadContractErrorType | null;
  isLoading: boolean;
  isPending: boolean;
} => {
  const { data, error, isLoading, isPending } = useReadContract({
    query: {
      enabled: !!address && !!chainId && !!tokenAddress,
    },
    address: tokenAddress,
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return {
    data: _.isNil(data) ? undefined : BigInt(data),
    error,
    isLoading,
    isPending,
  };
};

export const useTokenData = ({
  address,
  tokenAddress,
  chainId,
}: {
  address: Hex;
  tokenAddress: Hex | undefined;
  chainId: number | undefined;
}): {
  metadata: TokenMetadata | undefined;
  balance: TokenBalance | undefined;
  error: MulticallErrorType | ReadContractErrorType | null;
  isLoading: boolean;
  isPending: boolean;
} => {
  const result = useReadContracts({
    allowFailure: false,
    query: {
      enabled: !!address && !!chainId && !!tokenAddress,
    },
    contracts: [
      {
        address: tokenAddress,
        chainId,
        abi: erc20Abi,
        functionName: 'decimals',
      },
      {
        address: tokenAddress,
        chainId,
        abi: erc20Abi,
        functionName: 'name',
      },
      {
        address: tokenAddress,
        chainId,
        abi: erc20Abi,
        functionName: 'symbol',
      },
      {
        address: tokenAddress,
        chainId,
        abi: erc20Abi,
        functionName: 'totalSupply',
      },
      {
        address: tokenAddress,
        chainId,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      },
    ],
  });

  return {
    error: result.error,
    isPending: result.isPending,
    isLoading: result.isLoading,
    metadata: result.data
      ? ({
          address: tokenAddress as Hex,
          decimals: Number(result.data[0]),
          name: result.data[1],
          symbol: result.data[2],
          totalSupply: result.data[3],
        } as TokenMetadata)
      : undefined,
    balance: result.data
      ? {
          decimals: Number(result.data[0]),
          symbol: result.data[2],
          value: result.data[4],
        }
      : undefined,
  };
};

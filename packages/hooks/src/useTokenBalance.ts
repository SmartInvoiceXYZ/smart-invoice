import { type QueryKey } from '@tanstack/react-query';
import { ResolvedRegister } from '@wagmi/core';
import { ReadContractOptions, readContractQueryKey } from '@wagmi/core/query';
import _ from 'lodash';
import { erc20Abi, Hex, ReadContractErrorType } from 'viem';
import { useReadContract } from 'wagmi';

const createTokenBalanceQueryOptions = ({
  tokenAddress,
  address,
  chainId,
}: {
  tokenAddress: Hex | undefined;
  address: Hex | undefined;
  chainId: number | undefined;
}):
  | ReadContractOptions<
      typeof erc20Abi,
      'balanceOf',
      [Hex],
      ResolvedRegister['config']
    >
  | undefined => {
  if (!address || !tokenAddress || !chainId) {
    return undefined;
  }

  return {
    address: tokenAddress,
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  };
};

export const createTokenBalanceQueryKey = ({
  tokenAddress,
  address,
  chainId,
}: {
  tokenAddress: Hex | undefined;
  address: Hex | undefined;
  chainId: number | undefined;
}) =>
  readContractQueryKey(
    createTokenBalanceQueryOptions({ tokenAddress, address, chainId }),
  ) as QueryKey;

export const useTokenBalance = ({
  tokenAddress,
  address,
  chainId,
}: {
  tokenAddress: Hex | undefined;
  address: Hex | undefined;
  chainId: number | undefined;
}): {
  data: bigint | undefined;
  error: ReadContractErrorType | null;
  isLoading: boolean;
  isPending: boolean;
} => {
  const { data, error, isLoading, isPending } = useReadContract(
    createTokenBalanceQueryOptions({ tokenAddress, address, chainId }),
  );

  return {
    data: _.isNil(data) ? undefined : BigInt(data as string),
    error,
    isLoading,
    isPending,
  };
};

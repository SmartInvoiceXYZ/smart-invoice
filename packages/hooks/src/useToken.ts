import { TokenMetadata } from '@smartinvoicexyz/graphql';
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
  const result = useReadContract({
    query: {
      enabled: !!address && !!chainId && !!tokenAddress,
    },
    address: tokenAddress,
    chainId,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return result;
};

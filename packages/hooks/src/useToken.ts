import { TokenMetadata } from '@smartinvoicexyz/graphql';
import _ from 'lodash';
import { erc20Abi, Hex } from 'viem';
import { useReadContracts } from 'wagmi';

export const useToken = ({
  address,
  chainId,
}: {
  address: Hex | undefined;
  chainId: number | undefined;
}) => {
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

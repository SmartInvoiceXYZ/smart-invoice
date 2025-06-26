import { SMART_INVOICE_INSTANT_ABI } from '@smartinvoicexyz/constants/src/abi/ISmartInvoiceInstantAbi';
import { Config, readContract, readContracts } from '@wagmi/core';
import { erc20Abi, Hex } from 'viem';

export const fetchTokenBalance = async (
  config: Config,
  address: Hex,
  tokenAddress: Hex,
  chainId: number,
): Promise<bigint> =>
  readContract(config, {
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
    chainId,
  });

export const fetchTokenMetadata = async (
  config: Config,
  tokenAddress: Hex | undefined,
  chainId: number | undefined,
): Promise<[number, string, string] | undefined> => {
  if (!tokenAddress || !chainId) {
    return undefined;
  }

  const results = await readContracts(config, {
    allowFailure: false,
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
    ],
  });

  return results;
};

type InstantInvoiceContractData = [
  bigint,
  bigint,
  boolean,
  bigint,
  bigint,
  bigint,
];

export const fetchInstantInvoice = async (
  config: Config,
  address: Hex | undefined,
  chainId: number | undefined,
): Promise<InstantInvoiceContractData | undefined> => {
  if (!address || !chainId) {
    return undefined;
  }
  const instantEscrowContract = {
    address,
    abi: SMART_INVOICE_INSTANT_ABI,
    chainId,
  };

  const results = await readContracts(config, {
    allowFailure: false,
    contracts: [
      {
        ...instantEscrowContract,
        functionName: 'getTotalDue',
      },
      {
        ...instantEscrowContract,
        functionName: 'totalFulfilled',
      },
      {
        ...instantEscrowContract,
        functionName: 'fulfilled',
      },
      {
        ...instantEscrowContract,
        functionName: 'deadline',
      },
      {
        ...instantEscrowContract,
        functionName: 'lateFee',
      },
      {
        ...instantEscrowContract,
        functionName: 'lateFeeTimeInterval',
      },
    ],
  });

  return results;
};

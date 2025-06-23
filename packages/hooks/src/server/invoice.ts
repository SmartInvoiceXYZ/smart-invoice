import { SMART_INVOICE_INSTANT_ABI } from '@smartinvoicexyz/constants';
import { TokenBalance, TokenMetadata } from '@smartinvoicexyz/graphql';
import { publicClients } from '@smartinvoicexyz/utils/src';
import { erc20Abi, Hex } from 'viem';

export const fetchTokenData = async (
  address: Hex,
  tokenAddress: Hex,
  chainId: number,
) => {
  const client = publicClients[chainId];
  if (!client) throw new Error(`No client for chain ${chainId}`);

  const [decimals, name, symbol, totalSupply, balance] = await Promise.all([
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals',
    }),
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'name',
    }),
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'symbol',
    }),
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'totalSupply',
    }),
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    }),
  ]);

  const metadata: TokenMetadata = {
    address: tokenAddress,
    name,
    symbol,
    decimals: Number(decimals),
    totalSupply,
  };

  const tokenBalance: TokenBalance = {
    value: balance,
    decimals: Number(decimals),
    symbol,
  };

  return { metadata, balance: tokenBalance };
};

export const fetchNativeBalance = async (address: Hex, chainId: number) => {
  const client = publicClients[chainId];
  if (!client) throw new Error(`No client for chain ${chainId}`);

  const balance = await client.getBalance({ address });
  const { chain } = client;
  if (!chain) throw new Error(`No chain info for chain ${chainId}`);

  return {
    value: balance,
    decimals: 18,
    symbol: chain.nativeCurrency.symbol,
  } as TokenBalance;
};

export const fetchInstantInvoice = async (address: Hex, chainId: number) => {
  const client = publicClients[chainId];
  if (!client) throw new Error(`No client for chain ${chainId}`);

  const instantEscrowContract = {
    address,
    abi: SMART_INVOICE_INSTANT_ABI,
  };

  const [
    getTotalDue,
    totalFulfilled,
    fulfilled,
    deadline,
    lateFee,
    lateFeeTimeInterval,
  ] = await Promise.all([
    client.readContract({
      ...instantEscrowContract,
      functionName: 'getTotalDue',
    }),
    client.readContract({
      ...instantEscrowContract,
      functionName: 'totalFulfilled',
    }),
    client.readContract({
      ...instantEscrowContract,

      functionName: 'fulfilled',
    }),
    client.readContract({
      ...instantEscrowContract,

      functionName: 'deadline',
    }),
    client.readContract({
      ...instantEscrowContract,
      functionName: 'lateFee',
    }),
    client.readContract({
      ...instantEscrowContract,
      functionName: 'lateFeeTimeInterval',
    }),
  ]);

  return {
    totalDue: getTotalDue as bigint,
    amountFulfilled: totalFulfilled as bigint,
    fulfilled: fulfilled as boolean,
    deadline: deadline as bigint,
    lateFee: lateFee as bigint,
    lateFeeTimeInterval: lateFeeTimeInterval as bigint,
  };
};

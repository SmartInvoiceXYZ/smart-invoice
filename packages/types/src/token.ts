import { Address } from 'viem';

export type IToken = {
  chainId: number;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}
import { Hex } from 'viem';

type CommonTokenData = {
  symbol: string;
  decimals: number;
  image?: string;
};

export type TokenDataInput = {
  tokenContract: Hex;
} & CommonTokenData;

export type TokenData = {
  address?: string;
} & CommonTokenData;

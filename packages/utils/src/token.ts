/* eslint-disable no-restricted-syntax */

import { ChainId } from '@smart-invoice/constants';
import { TokenData } from '@smart-invoice/types';
import _ from 'lodash';
import { Address, getAddress, Hex } from 'viem';

interface TokenList {
  [chainId: number]: {
    [tokenContract: string]: {
      decimals: number;
      symbol: string;
      image: string;
    };
  };
}

export const formatTokenData = (rawList: TokenList) => {
  const tokenObject = {} as Record<ChainId, Record<string, TokenData>>;

  _.forEach(_.keys(rawList), (chainId: string) => {
    const chainTokenList = rawList[_.toNumber(chainId)];

    _.forEach(_.keys(chainTokenList), tokenContract => {
      const address = _.toLower(tokenContract);
      const { decimals, symbol, image } = chainTokenList[tokenContract];
      // update new object
      tokenObject[Number(chainId)][address] = {
        address,
        decimals,
        symbol,
        image,
      };
    });
  });

  return tokenObject;
};

export const formatTokens = (
  object: Record<ChainId, Record<Address, TokenData>>,
) => {
  const tokenObject = {} as Record<ChainId, Address[]>;

  _.each(_.keys(object), chainId => {
    const chainTokenList = object[_.toNumber(chainId)];
    const tokenArray = [] as Address[];
    _.each(_.keys(chainTokenList), tokenAddress => {
      tokenArray.push(getAddress(tokenAddress));
    });
    tokenObject[Number(chainId)] = tokenArray;
  });

  return tokenObject;
};

type ChainTokenList = { [address: Hex]: TokenData };

export const getTokenSymbol = (
  token: string,
  chainId: number,
  tokenData: { [key: number]: ChainTokenList },
) => tokenData[_.toNumber(chainId)][token as Hex]?.symbol;

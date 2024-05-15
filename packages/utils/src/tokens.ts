/* eslint-disable no-restricted-syntax */
import {
  ChainId,
  DEFAULT_CHAIN_ID,
  isOfTypeChainId,
} from '@smart-invoice/constants';
import { TokenData, TokenDataInput } from '@smart-invoice/types';
import _ from 'lodash';
import { Address, getAddress, Hex, zeroAddress } from 'viem';

interface TokenList {
  [chainId: number]: TokenDataInput[];
}

export const formatTokenData = (rawList: TokenList) => {
  const tokenObject = {} as Record<ChainId, Record<string, TokenData>>;

  _.forEach(_.keys(rawList), (chainId: string) => {
    const chainTokenList = rawList[_.toNumber(chainId)];

    tokenObject[Number(chainId)] = {} as Record<string, TokenData>;

    _.forEach(chainTokenList, (token: TokenDataInput) => {
      const { tokenContract, decimals, symbol, image } = token;
      // update new object
      tokenObject[Number(chainId)][_.toLower(tokenContract)] = {
        address: tokenContract,
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

    const tokenArray: Hex[] = _.map(_.keys(chainTokenList), tokenAddress =>
      getAddress(tokenAddress),
    );
    tokenObject[Number(chainId)] = _.compact(tokenArray);
  });

  return tokenObject;
};

type ChainTokenList = { [address: Hex]: TokenData };

export const getTokenSymbol = (
  chainId: number,
  token: string | undefined,
  tokenData: { [key: number]: ChainTokenList } | undefined,
) => tokenData?.[_.toNumber(chainId)][_.toLower(token) as Hex]?.symbol;

export const getTokens = (
  allTokens: Record<ChainId, string[]>,
  chainId?: number,
) =>
  chainId && isOfTypeChainId(chainId)
    ? allTokens[chainId]
    : allTokens[DEFAULT_CHAIN_ID];

export const getTokenInfo = (
  chainId?: number,
  token?: string,
  tokenData?: Record<ChainId, Record<string, TokenData>>,
) => {
  if (
    !chainId ||
    !isOfTypeChainId(chainId) ||
    !token ||
    !tokenData ||
    _.isEmpty(_.keys(tokenData))
  ) {
    return {
      address: zeroAddress,
      decimals: 18,
      symbol: 'UNKNOWN',
    };
  }
  const tokenDataByChain =
    tokenData[chainId as ChainId] || tokenData[DEFAULT_CHAIN_ID];
  if (!tokenDataByChain?.[_.toLower(token)]) {
    return {
      address: zeroAddress,
      decimals: 18,
      symbol: 'UNKNOWN',
    };
  }
  return tokenDataByChain[_.toLower(token)];
};

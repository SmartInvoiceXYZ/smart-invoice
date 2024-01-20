/* eslint-disable radix */
import {
  ChainId,
  DEFAULT_CHAIN_ID,
  graphUrls,
  invoiceFactory,
  IPFS_ENDPOINT,
  isOfTypeChainId,
  resolverInfo,
  resolvers,
  SUPPORTED_NETWORKS,
  wrappedNativeToken,
} from '@smart-invoice/constants';
import { TokenData } from '@smart-invoice/types';
import _ from 'lodash';
import { Address, zeroAddress } from 'viem';

import { chainsMap } from '.';

export const unsupportedNetwork = (chainId: number) =>
  !_.includes(SUPPORTED_NETWORKS, chainId);

export const getDateString = (timeInSec: number) => {
  if (timeInSec !== 0) {
    return 'Not provided';
  }
  const date = new Date(timeInSec ? timeInSec * 1000 : 0);
  const ye = new Intl.DateTimeFormat('en', {
    year: 'numeric',
  }).format(date);
  const mo = new Intl.DateTimeFormat('en', {
    month: 'long',
  }).format(date);
  const da = new Intl.DateTimeFormat('en', {
    day: '2-digit',
  }).format(date);
  return `${mo} ${da}, ${ye}`;
};

export const getGraphUrl = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? graphUrls(chainId)
    : graphUrls(DEFAULT_CHAIN_ID);

export const getResolvers = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? resolvers(chainId)
    : resolvers(DEFAULT_CHAIN_ID);

export const getResolverInfo = (resolver: Address, chainId?: number) =>
  (chainId && isOfTypeChainId(chainId)
    ? resolverInfo(chainId)
    : resolverInfo(DEFAULT_CHAIN_ID))[resolver];

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
    Object.keys(tokenData || {}).length === 0
  ) {
    return {
      address: zeroAddress,
      decimals: 18,
      symbol: 'UNKNOWN',
    };
  }
  const tokenDataByChain =
    tokenData[chainId as ChainId] || tokenData[DEFAULT_CHAIN_ID];
  if (!tokenDataByChain[token]) {
    return {
      address: zeroAddress,
      decimals: 18,
      symbol: 'UNKNOWN',
    };
  }
  return tokenDataByChain[token];
};

export const getWrappedNativeToken = (chainId?: number) =>
  chainId && wrappedNativeToken(chainId);

export const getNativeTokenSymbol = (chainId?: number) =>
  chainId && chainsMap(chainId).nativeCurrency;

export const getInvoiceFactoryAddress = (chainId: number) =>
  isOfTypeChainId(chainId)
    ? invoiceFactory(chainId)
    : invoiceFactory(DEFAULT_CHAIN_ID);

const getExplorerUrl = (chainId: number) => {
  const chain = chainsMap(chainId);
  return _.get(
    chain,
    'blockExplorers.etherscan.url',
    _.get(chain, 'blockExplorers.default.url'),
  );
};

export const getTxLink = (chainId: number, hash: string) =>
  `${getExplorerUrl(chainId)}/tx/${hash}`;

export const getAddressLink = (chainId: number, hash: string) =>
  `${getExplorerUrl(chainId)}/address/${hash}`;

// bytes58 QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51
// is the same as
// bytes64 12200000000000000000000000000000000000000000000000000000000000000000
// which means an all zeros bytes32 was input on the contract
export const getIpfsLink = (hash: string) =>
  hash === 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51'
    ? ''
    : `${IPFS_ENDPOINT}/ipfs/${hash}`;

export const getAccountString = (account?: string) => {
  if (!account) return undefined;
  const len = account.length;
  return `0x${account.substr(2, 3).toUpperCase()}...${account
    .substr(len - 3, len - 1)
    .toUpperCase()}`;
};

export const isKnownResolver = (resolver: Address, chainId?: number) =>
  _.includes(getResolvers(chainId), _.toLower(resolver));

export const getResolverString = (resolver: Address, chainId?: number) => {
  const info = getResolverInfo(resolver, chainId);
  return info ? info.name : getAccountString(resolver);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logError = (message?: any, ...optionalParams: any[]) => {
  // eslint-disable-next-line no-console
  console.error(message, optionalParams);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logDebug = (message?: any, ...optionalParams: any[]) => {
  if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
    // eslint-disable-next-line no-console
    console.debug(message, optionalParams);
  }
};

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/;

export const isValidURL = (str: string) => !!URL_REGEX.test(str);

const BASE32_REGEX = /^[a-zA-Z2-7]+=*$/;
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+=*$/;

export const isValidCID = (hash: string) =>
  (hash.length === 59 &&
    hash.startsWith('bafy') &&
    !!BASE32_REGEX.test(hash)) ||
  (hash.length === 46 && hash.startsWith('Qm') && !!BASE58_REGEX.test(hash));

export const isValidLink = (url: string) => {
  if (!url) return false;
  if (url.startsWith('ipfs://')) {
    return isValidCID(url.slice(7));
  }
  return isValidURL(url);
};

export function commify(x: number | bigint | string) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const calculateResolutionFeePercentage = (resolutionRate: string) => {
  const feePercentage = 1 / parseInt(resolutionRate);

  return feePercentage;
};

export const dateTimeToDate = (dateTime: string) => dateTime.split(',')[0];

interface ProjectAgreement {
  src: string;
  type: string;
}

export const getAgreementLink = (projectAgreement: ProjectAgreement[]) => {
  if (_.isEmpty(projectAgreement)) return '';

  const address = _.get(
    _.nth(projectAgreement, _.size(projectAgreement) - 1),
    'src',
  );
  if (
    _.get(_.nth(projectAgreement, _.size(projectAgreement) - 1), 'type') ===
    'ipfs'
  ) {
    // address.substring(7) removes ipfs:// from the beginning of the src string
    const hash = address?.substring(7);
    const link = `${IPFS_ENDPOINT}/ipfs/${hash}`;
    return link;
  }
  return address;
};

export const formatDate = (date: number | string) => {
  const d = new Date(date);

  let month = `${d.getUTCMonth() + 1}`;
  if (month.length < 2) month = `0${month}`;

  let day = `${d.getUTCDate()}`;
  if (day.length < 2) day = `0${day}`;

  const year = d.getUTCFullYear();

  return [year, month, day].join('-');
};

export const sum = (array: number[]) =>
  array.reduce((total: number, current: number) => total + current, 0);

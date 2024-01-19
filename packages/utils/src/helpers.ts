/* eslint-disable no-restricted-syntax */
/* eslint-disable radix */

import { Address, getAddress } from 'viem';

import {
  ADDRESS_ZERO,
  DEFAULT_CHAIN_ID,
  IPFS_ENDPOINT,
  chainIds,
  explorerUrls,
  graphUrls,
  hexChainIds,
  invoiceFactory,
  nativeSymbols,
  networkLabels,
  networkNames,
  resolverInfo,
  resolvers,
  rpcUrls,
  wrappedNativeToken,
  ChainId, isOfTypeChainId
} from '@smart-invoice/constants';
import { Network, TokenData } from '@smart-invoice/types';

export const getDateString = (timeInSec: any) => {
  if (parseInt(timeInSec) !== 0) {
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
  }
  return 'Not provided';
};
// returns the checksummed address if the address is valid, otherwise returns false
export const isAddress = (value: any) => {
  try {
    return getAddress(value).toLowerCase() as Address;
  } catch (err) {
    return false;
  }
};

export const getNetworkName = (chainId: number) =>
  isOfTypeChainId(chainId) ? networkNames[chainId] : 'Unknown Chain';

export const getGraphUrl = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? graphUrls[chainId]
    : graphUrls[DEFAULT_CHAIN_ID];

export const getExplorerUrl = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? explorerUrls[chainId]
    : explorerUrls[DEFAULT_CHAIN_ID];

export const getRpcUrl = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? rpcUrls[chainId]
    : rpcUrls[DEFAULT_CHAIN_ID];

export const getResolvers = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? resolvers[chainId]
    : resolvers[DEFAULT_CHAIN_ID];

export const getResolverInfo = (resolver: Address, chainId?: number) =>
  (chainId && isOfTypeChainId(chainId)
    ? resolverInfo[chainId]
    : resolverInfo[DEFAULT_CHAIN_ID])[resolver];

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
      address: ADDRESS_ZERO,
      decimals: 18,
      symbol: 'UNKNOWN',
    };
  }
  const tokenDataByChain =
    tokenData[chainId as ChainId] || tokenData[DEFAULT_CHAIN_ID];
  if (!tokenDataByChain[token]) {
    return {
      address: ADDRESS_ZERO,
      decimals: 18,
      symbol: 'UNKNOWN',
    };
  }
  return tokenDataByChain[token];
};

export const getWrappedNativeToken = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? wrappedNativeToken[chainId]
    : wrappedNativeToken[DEFAULT_CHAIN_ID];

export const getNativeTokenSymbol = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? nativeSymbols[chainId]
    : nativeSymbols[DEFAULT_CHAIN_ID];

export const getInvoiceFactoryAddress = (chainId: number) =>
  isOfTypeChainId(chainId)
    ? invoiceFactory[chainId]
    : invoiceFactory[DEFAULT_CHAIN_ID];

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
  getResolvers(chainId).indexOf(resolver?.toLowerCase() as Address) !== -1;

export const getResolverString = (resolver: Address, chainId?: number) => {
  const info = getResolverInfo(resolver, chainId);
  return info ? info.name : getAccountString(resolver);
};

export const logError = (message?: any, ...optionalParams: any[]) => {
  // eslint-disable-next-line no-console
  console.error(message, optionalParams);
};

export const logDebug = (message?: any, ...optionalParams: any[]) => {
  if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
    // eslint-disable-next-line no-console
    console.debug(message, optionalParams);
  }
};

export const copyToClipboard = (value: any) => {
  const tempInput = document.createElement('input');
  tempInput.value = value;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
};

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/;

export const isValidURL = (str: any) => !!URL_REGEX.test(str);

const BASE32_REGEX = /^[a-zA-Z2-7]+=*$/;
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+=*$/;

export const isValidCID = (hash: any) =>
  (hash.length === 59 &&
    hash.startsWith('bafy') &&
    !!BASE32_REGEX.test(hash)) ||
  (hash.length === 46 && hash.startsWith('Qm') && !!BASE58_REGEX.test(hash));

export const isValidLink = (url: any) => {
  if (!url) return false;
  if (url.startsWith('ipfs://')) {
    return isValidCID(url.slice(7));
  }
  return isValidURL(url);
};

export const getChainId = (network: Network) =>
  chainIds[network] || chainIds.rinkeby;

export const getHexChainId = (network?: Network) =>
  network ? hexChainIds[network] || hexChainIds.rinkeby : undefined;

export const getNetworkLabel = (chainId: number) =>
  isOfTypeChainId(chainId) ? networkLabels[chainId] : 'unknown';

export const formatTokenData = (object: any) => {
  const tokenObject = {} as Record<ChainId, Record<string, TokenData>>;

  for (const [key, value] of Object.entries(object)) {
    const tokenDetails = {} as Record<string, TokenData>;

    // @ts-expect-error TS(2339): Property 'tokenContract' does not exist on type 'u... Remove this comment to see the full error message
    for (const { tokenContract, decimals, symbol, image } of Object.values(
      // @ts-expect-error TS(2769): No overload matches this call.
      value,
    )) {
      const address = tokenContract.toLowerCase();
      tokenDetails[address] = {
        address,
        decimals,
        symbol,
        image,
      };
    }
    tokenObject[Number(key) as ChainId] = tokenDetails;
  }

  return tokenObject;
};

export const formatTokens = (
  object: Record<ChainId, Record<Address, TokenData>>,
) => {
  const tokenObject = {} as Record<ChainId, Address[]>;
  for (const [key, value] of Object.entries(object)) {
    const tokenArray = [] as Address[];
    for (const tokenAddress of Object.keys(value)) {
      tokenArray.push(getAddress(tokenAddress));
    }
    tokenObject[Number(key) as ChainId] = tokenArray;
  }

  return tokenObject;
};

export const calculateResolutionFeePercentage = (resolutionRate: any) => {
  const feePercentage = 1 / parseInt(resolutionRate);

  return feePercentage;
};

export const getTokenSymbol = (token: any, chainId: number, tokenData: any) =>
  tokenData[chainId][token].symbol;

export const dateTimeToDate = (dateTime: any) => dateTime.split(',')[0];

export const getAgreementLink = (projectAgreement: any) => {
  if ((projectAgreement || []).length === 0) {
    return '';
  }
  const address = projectAgreement[projectAgreement.length - 1].src;
  if (projectAgreement[projectAgreement.length - 1].type === 'ipfs') {
    // address.substring(7) removes ipfs:// from the beginning of the src string
    const hash = address.substring(7);
    const link = `${IPFS_ENDPOINT}/ipfs/${hash}`;
    return link;
  }
  return address;
};

export const formatDate = (date: any) => {
  const d = new Date(date);

  let month = `${d.getUTCMonth() + 1}`;
  if (month.length < 2) month = `0${month}`;

  let day = `${d.getUTCDate()}`;
  if (day.length < 2) day = `0${day}`;

  const year = d.getUTCFullYear();

  return [year, month, day].join('-');
};

export const sum = (array: any) =>
  array.reduce((total: any, current: any) => total + current, 0);

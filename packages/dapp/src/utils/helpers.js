import { getAddress } from '@ethersproject/address';
import CID from 'cids';

import {
  explorerUrls,
  graphUrls,
  invoiceFactory,
  IPFS_ENDPOINT,
  nativeSymbols,
  networkNames,
  resolverInfo,
  resolvers,
  rpcUrls,
  tokenInfo,
  tokens,
  wrappedNativeToken,
} from './constants';

export const getDateString = timeInSec => {
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

// returns the checksummed address if the address is valid, otherwise returns false
export const isAddress = value => {
  try {
    return getAddress(value).toLowerCase();
  } catch {
    return false;
  }
};

export const getNetworkName = chainId =>
  networkNames[chainId] || networkNames[4];

export const getGraphUrl = chainId => graphUrls[chainId] || graphUrls[4];

export const getExplorerUrl = chainId =>
  explorerUrls[chainId] || explorerUrls[4];

export const getRpcUrl = chainId => rpcUrls[chainId] || rpcUrls[4];

export const getResolvers = chainId => resolvers[chainId] || resolvers[4];

export const getResolverInfo = (chainId, resolver) =>
  (resolverInfo[chainId] || resolverInfo[4])[resolver];

export const getTokens = chainId => tokens[chainId] || tokens[4];

export const getTokenInfo = (chainId, token) =>
  (tokenInfo[chainId] || tokenInfo[4])[token] || {
    decimals: 18,
    symbol: 'UNKNOWN',
  };

export const getWrappedNativeToken = chainId =>
  wrappedNativeToken[chainId] || wrappedNativeToken[4];

export const getNativeTokenSymbol = chainId =>
  nativeSymbols[chainId] || nativeSymbols[4];

export const getInvoiceFactoryAddress = chainId =>
  invoiceFactory[chainId] || invoiceFactory[4];

export const getTxLink = (chainId, hash) =>
  `${getExplorerUrl(chainId)}/tx/${hash}`;

export const getAddressLink = (chainId, hash) =>
  `${getExplorerUrl(chainId)}/address/${hash}`;

export const getIpfsLink = hash => `${IPFS_ENDPOINT}/ipfs/${hash}`;

export const getAccountString = account => {
  const len = account.length;
  return `0x${account.substr(2, 3).toUpperCase()}...${account
    .substr(len - 3, len - 1)
    .toUpperCase()}`;
};

export const isKnownResolver = (chainId, resolver) =>
  getResolvers(chainId).indexOf(resolver.toLowerCase()) !== -1;

export const getResolverString = (chainId, resolver) => {
  const info = getResolverInfo(chainId, resolver);
  return info ? info.name : getAccountString(resolver);
};

export const logError = error => {
  // eslint-disable-next-line no-console
  console.error(error);
};

export const logDebug = msg => {
  if (process.env.REACT_APP_DEBUG_LOGS === 'true') {
    // eslint-disable-next-line no-console
    console.debug(msg);
  }
};

export const copyToClipboard = value => {
  const tempInput = document.createElement('input');
  tempInput.value = value;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
};

export const isValidHttpsURL = str => {
  const pattern = new RegExp(
    '^(?:https:\\/\\/)' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(?::\\d{2,5})?' + // port
      '(?:[/?#][^\\s"]*)?', // path
    'i',
  ); // fragment locator
  return !!pattern.test(str);
};

export const isCID = hash => {
  try {
    new CID(hash); // eslint-disable-line no-new
    return true;
  } catch (e) {
    return false;
  }
};

export const isValidURL = url => {
  if (!url) return false;
  if (url.startsWith('ipfs://')) {
    return isCID(url.slice(7));
  }
  return isValidHttpsURL(url);
};

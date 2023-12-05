import { Contract, utils } from 'ethers';

/* eslint-disable radix */
/* eslint-disable no-restricted-syntax */
import { getAddress } from '@ethersproject/address';

import {
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
} from '../constants';

export const getDateString = timeInSec => {
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
export const isAddress = value => {
  try {
    return getAddress(value).toLowerCase();
  } catch (err) {
    return false;
  }
};

export const getNetworkName = chainId =>
  networkNames[chainId] || 'Unknown Chain';

export const getGraphUrl = chainId =>
  graphUrls[chainId] || graphUrls[DEFAULT_CHAIN_ID];

export const getExplorerUrl = chainId =>
  explorerUrls[chainId] || explorerUrls[DEFAULT_CHAIN_ID];

export const getRpcUrl = chainId =>
  rpcUrls[chainId] || rpcUrls[DEFAULT_CHAIN_ID];

export const getResolvers = chainId =>
  resolvers[chainId] || resolvers[DEFAULT_CHAIN_ID];

export const getResolverInfo = (chainId, resolver) =>
  (resolverInfo[chainId] || resolverInfo[DEFAULT_CHAIN_ID])[resolver];

export const getTokens = (chainId, allTokens) =>
  allTokens[chainId] || allTokens[DEFAULT_CHAIN_ID];

export const getTokenInfo = (chainId, token, tokenData) => {
  if (!tokenData || Object.keys(tokenData || {}).length === 0) {
    return {
      decimals: 18,
      symbol: 'UNKNOWN',
    };
  }
  const tokenDataByChain = tokenData[chainId] || tokenData[DEFAULT_CHAIN_ID];
  if (!tokenDataByChain[token]) {
    return {
      decimals: 18,
      symbol: 'UNKNOWN',
    };
  }
  return tokenDataByChain[token];
};

export const getWrappedNativeToken = chainId =>
  wrappedNativeToken[chainId] || wrappedNativeToken[DEFAULT_CHAIN_ID];

export const getNativeTokenSymbol = chainId =>
  nativeSymbols[chainId] || nativeSymbols[DEFAULT_CHAIN_ID];

export const getInvoiceFactoryAddress = chainId =>
  invoiceFactory[chainId] || invoiceFactory[DEFAULT_CHAIN_ID];

export const getTxLink = (chainId, hash) =>
  `${getExplorerUrl(chainId)}/tx/${hash}`;

export const getAddressLink = (chainId, hash) =>
  `${getExplorerUrl(chainId)}/address/${hash}`;

// bytes58 QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51
// is the same as
// bytes64 12200000000000000000000000000000000000000000000000000000000000000000
// which means an all zeros bytes32 was input on the contract
export const getIpfsLink = hash =>
  hash === 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51'
    ? ''
    : `${IPFS_ENDPOINT}/ipfs/${hash}`;

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
  if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
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

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/;

export const isValidURL = str => !!URL_REGEX.test(str);

const BASE32_REGEX = /^[a-zA-Z2-7]+=*$/;
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+=*$/;

export const isValidCID = hash =>
  (hash.length === 59 &&
    hash.startsWith('bafy') &&
    !!BASE32_REGEX.test(hash)) ||
  (hash.length === 46 && hash.startsWith('Qm') && !!BASE58_REGEX.test(hash));

export const isValidLink = url => {
  if (!url) return false;
  if (url.startsWith('ipfs://')) {
    return isValidCID(url.slice(7));
  }
  return isValidURL(url);
};

export const getChainId = network => chainIds[network] || chainIds.rinkeby;

export const getHexChainId = network =>
  hexChainIds[network] || hexChainIds.rinkeby;

export const getNetworkLabel = chainId => networkLabels[chainId] || 'unknown';

export const verify = async (ethersProvider, address) => {
  const abi = new utils.Interface(['function verify() external']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.verify();
};

export const formatTokenData = object => {
  const tokenObject = {};

  for (const [key, value] of Object.entries(object)) {
    const tokenDetails = {};

    for (const { tokenContract, decimals, symbol, image } of Object.values(
      value,
    )) {
      tokenDetails[tokenContract.toLowerCase()] = {
        decimals,
        symbol,
        image,
      };
    }
    tokenObject[key] = tokenDetails;
  }

  return tokenObject;
};

export const formatTokens = object => {
  const tokenObject = {};
  for (const [key, value] of Object.entries(object)) {
    const tokenArray = [];
    for (const tokenAddress of Object.keys(value)) {
      tokenArray.push(tokenAddress);
    }
    tokenObject[key] = tokenArray;
  }

  return tokenObject;
};

export const calculateResolutionFeePercentage = resolutionRate => {
  const feePercentage = 1 / parseInt(resolutionRate);

  return feePercentage;
};

export const getTokenSymbol = (token, chainId, tokenData) =>
  tokenData[chainId][token].symbol;

export const dateTimeToDate = dateTime => dateTime.split(',')[0];

export const getAgreementLink = projectAgreement => {
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

export const formatDate = date => {
  const d = new Date(date);

  let month = `${d.getUTCMonth() + 1}`;
  if (month.length < 2) month = `0${month}`;

  let day = `${d.getUTCDate()}`;
  if (day.length < 2) day = `0${day}`;

  const year = d.getUTCFullYear();

  return [year, month, day].join('-');
};

export const sum = array =>
  array.reduce((total, current) => total + current, 0);

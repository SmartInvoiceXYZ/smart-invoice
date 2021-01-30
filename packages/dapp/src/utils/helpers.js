import { getAddress } from '@ethersproject/address';

import {
  ADDRESSES,
  EXPLORER_URL,
  IPFS_ENDPOINT,
  TOKEN_INFO,
} from './constants';

const { ARAGON_COURT, LEX_DAO } = ADDRESSES;

export const getDateString = timeInSec => {
  const date = new Date(timeInSec * 1000);
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

export const getResolverString = resolver => {
  switch (resolver) {
    case LEX_DAO:
      return 'LexDAO';
    case ARAGON_COURT:
      return 'Aragon Court';
    default:
      return getAccountString(resolver);
  }
};

export const getToken = token =>
  TOKEN_INFO[token.toLowerCase()] || { decimals: 18, symbol: 'UNKNOWN' };

// returns the checksummed address if the address is valid, otherwise returns false
export const isAddress = value => {
  try {
    return getAddress(value).toLowerCase();
  } catch {
    return false;
  }
};

export const getTxLink = hash => `${EXPLORER_URL}/tx/${hash}`;

export const getAddressLink = hash => `${EXPLORER_URL}/address/${hash}`;

export const getIpfsLink = hash => `${IPFS_ENDPOINT}/ipfs/${hash}`;

export const getAccountString = account => {
  const len = account.length;
  return `0x${account.substr(2, 3).toUpperCase()}...${account
    .substr(len - 3, len - 1)
    .toUpperCase()}`;
};

export const logError = error => {
  if (process.env.REACT_APP_DEBUG_LOGS === 'true') {
    // eslint-disable-next-line no-console
    console.error(error);
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

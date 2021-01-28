import { getAddress } from '@ethersproject/address';

import { ADDRESSES, EXPLORER_URL, NATIVE_TOKEN_SYMBOL } from './constants';

const { DAI_TOKEN, WRAPPED_TOKEN, ARAGON_COURT, LEX_DAO } = ADDRESSES;

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
      return resolver;
  }
};

export const getToken = token => {
  switch (token.toLowerCase()) {
    case WRAPPED_TOKEN:
      return { decimals: 18, symbol: `w${NATIVE_TOKEN_SYMBOL}` };
    case DAI_TOKEN:
    default:
      return { decimals: 18, symbol: 'DAI' };
  }
};

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

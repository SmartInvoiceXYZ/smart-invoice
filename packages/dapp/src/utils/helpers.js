import { getAddress } from '@ethersproject/address';

import { ADDRESSES } from './constants';

const { DAI_TOKEN, WETH_TOKEN } = ADDRESSES;

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

export const getResolverString = resolverType => {
  switch (resolverType) {
    case 'lex_dao':
      return 'Lex DAO';
    case 'aragon_court':
      return 'Aragon Court';
    default:
      return 'Custom';
  }
};

export const getToken = token => {
  switch (token.toLowerCase()) {
    case WETH_TOKEN:
      return { decimals: 18, symbol: 'WETH' };
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

export const getTxLink = hash => `https://rinkeby.etherscan.io/tx/${hash}`;

export const getAddressLink = hash =>
  `https://rinkeby.etherscan.io/address/${hash}`;

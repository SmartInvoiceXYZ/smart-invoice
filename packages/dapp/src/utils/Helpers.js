import { dai_token, weth_token } from "./Constants";

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
  switch (token) {
    case weth_token:
      return { decimals: 18, symbol: 'WETH' };
    case dai_token:
    default:
      return { decimals: 18, symbol: 'DAI' };
  }
};

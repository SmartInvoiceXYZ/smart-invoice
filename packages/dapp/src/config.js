import LexDAOLogo from './assets/lex-dao.png';

export const CONFIG = {
  INFURA_ID: process.env.REACT_APP_INFURA_ID,
  NETWORK: 4,
  IPFS_ENDPOINT: 'https://ipfs.infura.io',
  BOX_ENDPOINT: 'https://ipfs.3box.io',
  SUBGRAPH: 'dan13ram/rinkeby-smart-invoices',
  WRAPPED_NATIVE_TOKEN: '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
  INVOICE_FACTORY: '0x53f9963033706C37b9C265d388E998B6D8c72cF7'.toLowerCase(),
  RESOLVERS: {
    ['0x1206b51217271FC3ffCa57d0678121983ce0390E'.toLowerCase()]: {
      name: 'LexDAO',
      logoUrl: LexDAOLogo,
      termsUrl:
        'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
    },
  },
  TOKENS: {
    ['0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase()]: {
      decimals: 18,
      symbol: 'wETH',
    },
    ['0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42'.toLowerCase()]: {
      decimals: 18,
      symbol: 'DAI',
    },
    ['0x982e00B16c313E979C0947b85230907Fce45d50e'.toLowerCase()]: {
      decimals: 18,
      symbol: 'TEST',
    },
  },
};

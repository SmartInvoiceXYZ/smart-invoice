import LexDAOLogo from './assets/lex-dao.png';

const NETWORK = process.env.REACT_APP_NETWORK || 'rinkeby';

const RINKEBY_CONFIG = {
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

const XDAI_CONFIG = {
  INFURA_ID: process.env.REACT_APP_INFURA_ID,
  NETWORK: 100,
  IPFS_ENDPOINT: 'https://ipfs.infura.io',
  BOX_ENDPOINT: 'https://ipfs.3box.io',
  SUBGRAPH: 'dan13ram/xdai-smart-invoices',
  WRAPPED_NATIVE_TOKEN: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase(),
  INVOICE_FACTORY: '0x0d006D9e862B362180eb602e5973Fd1fdb6f78dd'.toLowerCase(),
  RESOLVERS: {
    ['0x034CfED494EdCff96f0D7160dC2B55Cae5Ee69E1'.toLowerCase()]: {
      name: 'LexDAO',
      logoUrl: LexDAOLogo,
      termsUrl:
        'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
    },
  },
  TOKENS: {
    ['0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase()]: {
      decimals: 18,
      symbol: 'WXDAI',
    },
  },
};

const CONFIGS = {
  rinkeby: RINKEBY_CONFIG,
  xdai: XDAI_CONFIG,
};

export const CONFIG = CONFIGS[NETWORK];

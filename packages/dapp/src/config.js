import LexDAOLogo from './assets/lex-dao.png';

export const CONFIG = {
  INFURA_ID: process.env.REACT_APP_INFURA_ID,
  IPFS_ENDPOINT: 'https://ipfs.infura.io',
  BOX_ENDPOINT: 'https://ipfs.3box.io',
  NETWORK_CONFIG: {
    100: {
      SUBGRAPH: 'dan13ram/xdai-smart-invoices',
      WRAPPED_NATIVE_TOKEN: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase(),
      INVOICE_FACTORY: '0x61cEBDf43a96581E6E144395fBA18f9D1a43e558'.toLowerCase(),
      TOKENS: {
        ['0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase()]: {
          decimals: 18,
          symbol: 'WXDAI',
        },
        ['0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase()]: {
          decimals: 18,
          symbol: 'XWETH',
        },
      },
      RESOLVERS: {
        ['0x034CfED494EdCff96f0D7160dC2B55Cae5Ee69E1'.toLowerCase()]: {
          name: 'LexDAO',
          logoUrl: LexDAOLogo,
          termsUrl:
            'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
        },
      },
    },
    4: {
      SUBGRAPH: 'dan13ram/rinkeby-smart-invoices',
      WRAPPED_NATIVE_TOKEN: '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
      INVOICE_FACTORY: '0x53f9963033706C37b9C265d388E998B6D8c72cF7'.toLowerCase(),
      TOKENS: {
        ['0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase()]: {
          decimals: 18,
          symbol: 'WETH',
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
      RESOLVERS: {
        ['0x1206b51217271FC3ffCa57d0678121983ce0390E'.toLowerCase()]: {
          name: 'LexDAO',
          logoUrl: LexDAOLogo,
          termsUrl:
            'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
        },
      },
    },
  },
};

import LexDAOLogo from './assets/lex-dao.png';

export const CONFIG = {
  INFURA_ID: process.env.REACT_APP_INFURA_ID,
  IPFS_ENDPOINT: 'https://smart-invoice.infura-ipfs.io',
  BOX_ENDPOINT: 'https://ipfs.3box.io',
  NETWORK_CONFIG: {
    1: {
      SUBGRAPH: 'psparacino/mainnet-smart-invoices',
      WRAPPED_NATIVE_TOKEN:
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase(),
      INVOICE_FACTORY:
        '0xe73251284989c4496985f16c718369bbc30ccf63'.toLowerCase(),
      RESOLVERS: {
        ['0x01b92e2c0d06325089c6fd53c98a214f5c75b2ac'.toLowerCase()]: {
          name: 'LexDAO',
          logoUrl: LexDAOLogo,
          termsUrl:
            'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
        },
      },
    },
    100: {
      SUBGRAPH: 'psparacino/v1-xdai-smart-invoices',
      WRAPPED_NATIVE_TOKEN:
        '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase(),
      INVOICE_FACTORY:
        '0xdDd96D43b0B2Ca179DCefA58e71798d0ce56c9c8'.toLowerCase(),
      RESOLVERS: {
        ['0x153Fbf5da827903e030Dc317C4031755D74D508a'.toLowerCase()]: {
          name: 'LexDAO',
          logoUrl: LexDAOLogo,
          termsUrl:
            'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
        },
      },
    },
    4: {
      SUBGRAPH: 'psparacino/smart-invoices-rinkey-ps',
      WRAPPED_NATIVE_TOKEN:
        '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
      INVOICE_FACTORY:
        '0x659912E406b11D457656468c655F2e545E552259'.toLowerCase(),
      RESOLVERS: {
        ['0x1206b51217271FC3ffCa57d0678121983ce0390E'.toLowerCase()]: {
          name: 'LexDAO',
          logoUrl: LexDAOLogo,
          termsUrl:
            'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
        },
      },
    },
    5: {
      SUBGRAPH: 'psparacino/goerli-smart-invoices',
      WRAPPED_NATIVE_TOKEN:
        '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'.toLowerCase(),
      INVOICE_FACTORY:
        '0x546adED0B0179d550e87cf909939a1207Fd26fB7'.toLowerCase(),
      RESOLVERS: {
        ['0x1206b51217271FC3ffCa57d0678121983ce0390E'.toLowerCase()]: {
          name: 'LexDAO',
          logoUrl: LexDAOLogo,
          termsUrl:
            'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
        },
      },
    },
    137: {
      SUBGRAPH: 'psparacino/v1-matic-smart-invoices',
      WRAPPED_NATIVE_TOKEN:
        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'.toLowerCase(),
      INVOICE_FACTORY:
        '0x6dcF61a9170419f30e065A43540aa3663b837342'.toLowerCase(),
      RESOLVERS: {
        ['0xf8DBd458f841424e2fD5fBDf18A7dEA17eb2211D'.toLowerCase()]: {
          name: 'LexDAO',
          logoUrl: LexDAOLogo,
          termsUrl:
            'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
        },
      },
    },
    80001: {
      SUBGRAPH: 'psparacino/v1-mumbai-smart-invoices',
      WRAPPED_NATIVE_TOKEN:
        '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889'.toLowerCase(),
      INVOICE_FACTORY:
        '0x131dcaeE86EF12D106446bf35f8Ae98A614ee5A9'.toLowerCase(),
      RESOLVERS: {
        ['0xf8DBd458f841424e2fD5fBDf18A7dEA17eb2211D'.toLowerCase()]: {
          name: 'LexDAO',
          logoUrl: LexDAOLogo,
          termsUrl:
            'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver',
        },
      },
    },
    31337: {
      SUBGRAPH: 'psparacino/goerli-smart-invoices',
      WRAPPED_NATIVE_TOKEN:
        '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'.toLowerCase(),
      INVOICE_FACTORY:
        '0x5FbDB2315678afecb367f032d93F642f64180aa3'.toLowerCase(),
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

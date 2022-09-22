import LexDAOLogo from './assets/lex-dao.png';

export const CONFIG = {
  INFURA_ID: process.env.REACT_APP_INFURA_ID,
  IPFS_ENDPOINT: 'https://smart-invoice.infura-ipfs.io',
  BOX_ENDPOINT: 'https://ipfs.3box.io',
  NETWORK_CONFIG: {
    1: {
      SUBGRAPH: 'psparacino/mainnet-smart-invoices',
      NETWORK_NAME: 'Ethereum Mainnet',
      WRAPPED_NATIVE_TOKEN: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase(),
      INVOICE_FACTORY: '0xe73251284989c4496985f16c718369bbc30ccf63'.toLowerCase(),
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
      SUBGRAPH: 'psparacino/xdai-smart-invoices',
      NETWORK_NAME: 'Gnosis Chain',
      WRAPPED_NATIVE_TOKEN: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase(),
      INVOICE_FACTORY: '0x11bf4CDFB506FAC501b8583F2C1292B368e765eC'.toLowerCase(),
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
      SUBGRAPH: 'psparacino/smart-invoices-rinkey-ps',
      NETWORK_NAME: 'Rinkeby',
      WRAPPED_NATIVE_TOKEN: '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
      INVOICE_FACTORY: '0x659912E406b11D457656468c655F2e545E552259'.toLowerCase(),
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

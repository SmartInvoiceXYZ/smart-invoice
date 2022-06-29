import LexDAOLogo from './assets/lex-dao.png';
const tokenData = require('./tokenData.json');
// console.log("TokenData:", tokenData.rinkeby)

// let tokenData;

// fetch("https://ipfs.infura.io/ipfs/bafybeiaixojwq6jcf2blsnj2mlb7cicduvm3g5glumuhchmnsyhiipiily/rinkeby%20copy.json")
// .then(response => response.json())
// .then(data => tokenData = data);

console.log('Raw Token Data:', tokenData);

function getTokensToNetworks(object) {
  let tokenObject = {};

  for (const [key, value] of Object.entries(object)) {
    let tokenDetails = {};

    for (const { tokenContract, decimals, symbol } of Object.values(value)) {
      tokenDetails[tokenContract.toLowerCase()] = {
        decimals: decimals,
        symbol: symbol,
      };
    }
    tokenObject[key] = tokenDetails;
  }

  return tokenObject;
}

const networkTokens = getTokensToNetworks(tokenData);
console.log('network token output:', networkTokens);

export const CONFIG = {
  INFURA_ID: process.env.REACT_APP_INFURA_ID,
  IPFS_ENDPOINT: 'https://ipfs.infura.io',
  BOX_ENDPOINT: 'https://ipfs.3box.io',
  NETWORK_CONFIG: {
    1: {
      SUBGRAPH: 'dan13ram/mainnet-smart-invoices',
      WRAPPED_NATIVE_TOKEN:
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase(),
      INVOICE_FACTORY:
        '0xb7019c3670f5d4dd99166727a7d29f8a16f4f20a'.toLowerCase(),
      TOKENS: {
        ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()]: {
          decimals: 18,
          symbol: 'WETH',
        },
      },
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
      SUBGRAPH: 'dan13ram/xdai-smart-invoices',
      WRAPPED_NATIVE_TOKEN:
        '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase(),
      INVOICE_FACTORY:
        '0x26832d296Be653C1A818B7AaF3D4e5e16A0C314d'.toLowerCase(),
      TOKENS: {
        ['0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase()]: {
          decimals: 18,
          symbol: 'WXDAI',
        },
        ['0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'.toLowerCase()]: {
          decimals: 18,
          symbol: 'WETH',
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
      SUBGRAPH: 'psparacino/dev-only-smart-invoice-rinkeby',
      WRAPPED_NATIVE_TOKEN:
        '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
      INVOICE_FACTORY:
        '0x09eBeE5BBC4D3bcB919b19a12EeD711c4748EA60'.toLowerCase(),
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
    31337: {
      SUBGRAPH: 'dan13ram/rinkeby-smart-invoices',
      WRAPPED_NATIVE_TOKEN:
        '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
      INVOICE_FACTORY:
        '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'.toLowerCase(),
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
        ['0x70997970c51812dc3a010c7d01b50e0d17dc79c8'.toLowerCase()]: {
          decimals: 18,
          symbol: 'hhETH',
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

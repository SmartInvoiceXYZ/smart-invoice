export const INFURA_ID = process.env.REACT_APP_INFURA_ID;
export const NETWORK = 4;
export const IPFS_ENDPOINT = 'https://ipfs.infura.io';
export const BOX_ENDPOINT = 'https://ipfs.3box.io';

const networkNames = {
  1: 'ETH Mainnet',
  4: 'Rinkeby Testnet',
  42: 'Kovan Testnet',
  100: 'xDai Chain',
};

const rpcUrls = {
  1: `https://mainnet.infura.io/v3/${INFURA_ID}`,
  4: `https://rinkeby.infura.io/v3/${INFURA_ID}`,
  42: `https://kovan.infura.io/v3/${INFURA_ID}`,
  100: 'https://xdai.poanetwork.dev',
};

const explorerUrls = {
  1: 'https://etherscan.io',
  4: 'https://rinkeby.etherscan.io',
  42: 'https://kovan.etherscan.io',
  100: 'https://blockscout.com/poa/xdai',
};

const nativeSymbols = {
  1: 'ETH',
  4: 'ETH',
  42: 'ETH',
  100: 'XDAI',
};

export const NETWORK_NAME = networkNames[NETWORK] || 'Rinkeby Testnet';
export const RPC_URL =
  rpcUrls[NETWORK] || `https://rinkeby.infura.io/v3/${INFURA_ID}`;
export const EXPLORER_URL =
  explorerUrls[NETWORK] || 'https://rinkeby.etherscan.io';
export const NATIVE_TOKEN_SYMBOL = nativeSymbols[NETWORK] || 'ETH';

// rinkeby
export const ADDRESSES = {
  // toLowerCase is IMPORTANT
  // TODO: change this to an actual valid lex_dao address
  LEX_DAO: '0x1206b51217271FC3ffCa57d0678121983ce0390E'.toLowerCase(),
  ARAGON_COURT: '0x52180af656a1923024d1accf1d827ab85ce48878'.toLowerCase(),
  DAI_TOKEN: '0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42'.toLowerCase(),
  WRAPPED_TOKEN: '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
  FACTORY: '0xFC6E7Bed72491D9508504a470524913f0049fD82'.toLowerCase(),
};

export const GRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/dan13ram/rinkeby-smart-invoices';

export const NAV_ITEMS = [
  {
    name: 'Home',
    link: '/',
  },
  {
    name: 'FAQ',
    link: '/faq',
  },
];

export const STEPS = {
  1: {
    step_title: 'Project Details',
    step_details: [
      'Note: All invoice data will be stored publicly on IPFS and can be viewed by anyone.',
      'If you have privacy concerns, we recommend taking care to add permissions to your project agreement document.',
    ],
    next: 'payment details',
  },
  2: {
    step_title: 'Payment Details',
    step_details: [],
    next: 'set payment amounts',
  },
  3: {
    step_title: 'Payment Chunks',
    step_details: [],
    next: 'confirmation',
  },
  4: {
    step_title: 'Confirmation',
    step_details: [],
    next: 'register invoice escrow',
  },
};

export const INVOICE_VERSION = 'smart-invoice-v0';

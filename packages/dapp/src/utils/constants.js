import { CONFIG } from '../config';

const { INFURA_ID, NETWORK, IPFS_ENDPOINT, BOX_ENDPOINT } = CONFIG;

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

export { INFURA_ID, NETWORK, IPFS_ENDPOINT, BOX_ENDPOINT };

export const INVOICE_VERSION = 'smart-invoice-v0';

export const URL_REGEX = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))|((ipfs|ipns|dweb):\/\/[a-zA-Z0-9/]+)|(^$)/;

export const NETWORK_NAME = networkNames[NETWORK] || 'Rinkeby Testnet';

export const RPC_URL =
  rpcUrls[NETWORK] || `https://rinkeby.infura.io/v3/${INFURA_ID}`;

export const EXPLORER_URL =
  explorerUrls[NETWORK] || 'https://rinkeby.etherscan.io';

export const NATIVE_TOKEN_SYMBOL = nativeSymbols[NETWORK] || 'ETH';

export const GRAPH_URL = `https://api.thegraph.com/subgraphs/name/${CONFIG.SUBGRAPH}`;

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export const ADDRESSES = {
  LEX_DAO: CONFIG.LEX_DAO.toLowerCase(),
  ARAGON_COURT: ADDRESS_ZERO,
  WRAPPED_TOKEN: CONFIG.WRAPPED_TOKEN.toLowerCase(),
  FACTORY: CONFIG.INVOICE_FACTORY.toLowerCase(),
};

export const TOKENS = Object.keys(CONFIG.TOKENS);

export const TOKEN_INFO = CONFIG.TOKENS;

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

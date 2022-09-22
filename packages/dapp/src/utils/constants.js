import { CONFIG } from '../config';

const { REACT_APP_INFURA_PROJECT_ID, REACT_APP_INFURA_PROJECT_SECRET } =
  process.env;

const { INFURA_ID, IPFS_ENDPOINT, BOX_ENDPOINT, NETWORK_CONFIG } = CONFIG;

export { INFURA_ID, IPFS_ENDPOINT, BOX_ENDPOINT };

export const chainIds = {
  xdai: 100,
  mainnet: 1,
  rinkeby: 4,
  goerli: 5,
  kovan: 42,
};

export const hexChainIds = {
  xdai: '0x64',
  mainnet: '0x01',
  rinkeby: '0x04',
  goerli: '0x05',
  kovan: '0x2a',
};

export const networkLabels = {
  100: 'xDai',
  1: 'Ethereum',
  3: 'Ropsten',
  4: 'Rinkeby',
  5: 'Goerli',
  42: 'Kovan',
  56: 'BSC',
  77: 'Sokol',
  137: 'Matic',
};

export const networkNames = {
  1: 'ETH Mainnet',
  4: 'Rinkeby Testnet',
  5: 'Goerli Testnet',
  42: 'Kovan Testnet',
  100: 'xDai Chain',
};

export const rpcUrls = {
  1: `https://mainnet.infura.io/v3/${INFURA_ID}`,
  4: `https://rinkeby.infura.io/v3/${INFURA_ID}`,
  5: `https://goerli.infura.io/v3/${INFURA_ID}`,
  42: `https://kovan.infura.io/v3/${INFURA_ID}`,
  100: 'https://rpc.xdaichain.com',
};

export const explorerUrls = {
  1: 'https://etherscan.io',
  4: 'https://rinkeby.etherscan.io',
  5: 'https://goerli.etherscan.io/',
  42: 'https://kovan.etherscan.io',
  100: 'https://blockscout.com/poa/xdai',
};

export const nativeSymbols = {
  1: 'ETH',
  4: 'ETH',
  5: 'ETH',
  42: 'ETH',
  100: 'XDAI',
};

export const graphUrls = {
  1: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[1].SUBGRAPH}`,
  4: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[4].SUBGRAPH}`,
  5: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[5].SUBGRAPH}`,
  100: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[100].SUBGRAPH}`,
};

export const resolvers = {
  1: Object.keys(NETWORK_CONFIG[1].RESOLVERS),
  4: Object.keys(NETWORK_CONFIG[4].RESOLVERS),
  5: Object.keys(NETWORK_CONFIG[5].RESOLVERS),
  100: Object.keys(NETWORK_CONFIG[100].RESOLVERS),
};

export const resolverInfo = {
  1: NETWORK_CONFIG[1].RESOLVERS,
  4: NETWORK_CONFIG[4].RESOLVERS,
  100: NETWORK_CONFIG[100].RESOLVERS,
};

export const wrappedNativeToken = {
  1: NETWORK_CONFIG[1].WRAPPED_NATIVE_TOKEN,
  4: NETWORK_CONFIG[4].WRAPPED_NATIVE_TOKEN,
  5: NETWORK_CONFIG[5].WRAPPED_NATIVE_TOKEN,
  100: NETWORK_CONFIG[100].WRAPPED_NATIVE_TOKEN,
};

export const invoiceFactory = {
  1: NETWORK_CONFIG[1].INVOICE_FACTORY,
  4: NETWORK_CONFIG[4].INVOICE_FACTORY,
  5: NETWORK_CONFIG[5].INVOICE_FACTORY,
  100: NETWORK_CONFIG[100].INVOICE_FACTORY,
};

export const SUPPORTED_NETWORKS = Object.keys(NETWORK_CONFIG).map(n =>
  Number(n),
);

export const INVOICE_VERSION = 'smart-invoice-v0';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export const STEPS = {
  1: {
    step_title: 'Project Details',
    step_details: [],
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
    next: 'create invoice',
  },
};

export const INFURA_AUTH =
  'Basic ' +
  Buffer.from(
    `${REACT_APP_INFURA_PROJECT_ID}` +
      ':' +
      `${REACT_APP_INFURA_PROJECT_SECRET}`,
  ).toString('base64');

import { getKeys } from '../utils/getKeys';
import { CONFIG } from './config';

export { CONFIG };

const INFURA_PROJECT_ID = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
const INFURA_PROJECT_SECRET = process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET;

const { INFURA_ID, IPFS_ENDPOINT, BOX_ENDPOINT, NETWORK_CONFIG } = CONFIG;

export { BOX_ENDPOINT, INFURA_ID, IPFS_ENDPOINT };

export const INVOICE_TYPES = {
  Escrow: 'escrow',
  Instant: 'instant',
};

export const DEFAULT_CHAIN_ID = 5;

export const chainIds = {
  gnosis: 100,
  mainnet: 1,
  rinkeby: 4,
  goerli: 5,
  kovan: 42,
  matic: 137,
  hardhat: 31337,
  mumbai: 80001,
};

export const hexChainIds = {
  gnosis: '0x64',
  mainnet: '0x01',
  rinkeby: '0x04',
  goerli: '0x05',
  kovan: '0x2a',
  hardhat: '0x7a69',
  matic: '0x89',
  mumbai: '0x13881',
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
  31337: 'Hardhat',
  80001: 'Mumbai',
};

export const networkNames = {
  1: 'Ethereum Mainnet',
  4: 'Rinkeby Testnet',
  5: 'Goerli Testnet',
  42: 'Kovan Testnet',
  100: 'Gnosis Chain',
  137: 'Polygon Mainnet',
  31337: 'Hardhat',
  80001: 'Mumbai Testnet',
};

export const rpcUrls = {
  1: `https://mainnet.infura.io/v3/${INFURA_ID}`,
  4: `https://rinkeby.infura.io/v3/${INFURA_ID}`,
  5: `https://goerli.infura.io/v3/${INFURA_ID}`,
  42: `https://kovan.infura.io/v3/${INFURA_ID}`,
  100: 'https://rpc.gnosischain.com/',
  137: `https://polygon-mainnet.infura.io/v3/${INFURA_ID}`,
  31337: 'http://localhost:8545',
  80001: `https://polygon-mumbai.infura.io/v3/${INFURA_ID}`,
};

export const explorerUrls = {
  1: 'https://etherscan.io',
  4: 'https://rinkeby.etherscan.io',
  5: 'https://goerli.etherscan.io',
  42: 'https://kovan.etherscan.io',
  100: 'https://gnosis.blockscout.com',
  137: 'https://polygonscan.com',
  31337: '',
  80001: 'https://mumbai.polygonscan.com',
};

export const nativeSymbols = {
  1: 'ETH',
  4: 'ETH',
  5: 'ETH',
  42: 'ETH',
  100: 'XDAI',
  137: 'MATIC',
  31337: 'ETH',
  80001: 'MATIC',
};

export const graphUrls = {
  1: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[1].SUBGRAPH}`,
  4: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[4].SUBGRAPH}`,
  5: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[5].SUBGRAPH}`,
  42: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[42].SUBGRAPH}`,
  100: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[100].SUBGRAPH}`,
  137: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[137].SUBGRAPH}`,
  31337: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[31337].SUBGRAPH}`,
  80001: `https://api.thegraph.com/subgraphs/name/${NETWORK_CONFIG[80001].SUBGRAPH}`,
};

export const resolvers = {
  1: Object.keys(NETWORK_CONFIG[1].RESOLVERS),
  4: Object.keys(NETWORK_CONFIG[4].RESOLVERS),
  5: Object.keys(NETWORK_CONFIG[5].RESOLVERS),
  42: Object.keys(NETWORK_CONFIG[42].RESOLVERS),
  100: Object.keys(NETWORK_CONFIG[100].RESOLVERS),
  137: Object.keys(NETWORK_CONFIG[137].RESOLVERS),
  31337: Object.keys(NETWORK_CONFIG[31337].RESOLVERS),
  80001: Object.keys(NETWORK_CONFIG[80001].RESOLVERS),
};

export const resolverInfo = {
  1: NETWORK_CONFIG[1].RESOLVERS,
  4: NETWORK_CONFIG[4].RESOLVERS,
  5: NETWORK_CONFIG[5].RESOLVERS,
  42: NETWORK_CONFIG[42].RESOLVERS,
  100: NETWORK_CONFIG[100].RESOLVERS,
  137: NETWORK_CONFIG[137].RESOLVERS,
  31337: NETWORK_CONFIG[31337].RESOLVERS,
  80001: NETWORK_CONFIG[80001].RESOLVERS,
};

export const wrappedNativeToken = {
  1: NETWORK_CONFIG[1].WRAPPED_NATIVE_TOKEN,
  4: NETWORK_CONFIG[4].WRAPPED_NATIVE_TOKEN,
  5: NETWORK_CONFIG[5].WRAPPED_NATIVE_TOKEN,
  42: NETWORK_CONFIG[42].WRAPPED_NATIVE_TOKEN,
  100: NETWORK_CONFIG[100].WRAPPED_NATIVE_TOKEN,
  137: NETWORK_CONFIG[137].WRAPPED_NATIVE_TOKEN,
  31337: NETWORK_CONFIG[31337].WRAPPED_NATIVE_TOKEN,
  80001: NETWORK_CONFIG[80001].WRAPPED_NATIVE_TOKEN,
};

export const invoiceFactory = {
  1: NETWORK_CONFIG[1].INVOICE_FACTORY,
  4: NETWORK_CONFIG[4].INVOICE_FACTORY,
  5: NETWORK_CONFIG[5].INVOICE_FACTORY,
  42: NETWORK_CONFIG[42].INVOICE_FACTORY,
  100: NETWORK_CONFIG[100].INVOICE_FACTORY,
  137: NETWORK_CONFIG[137].INVOICE_FACTORY,
  31337: NETWORK_CONFIG[31337].INVOICE_FACTORY,
  80001: NETWORK_CONFIG[80001].INVOICE_FACTORY,
};

export const SUPPORTED_NETWORKS = getKeys(NETWORK_CONFIG);

export const INVOICE_VERSION = 'smart-invoice-v0';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export const ESCROW_STEPS = {
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

export const INSTANT_STEPS = {
  1: {
    step_title: 'Project Details',
    step_details: [],
    next: 'payment details',
  },
  2: {
    step_title: 'Payment Details',
    step_details: [],
    next: 'confirm invoice',
  },
  3: {
    step_title: 'Confirmation',
    step_details: [],
    next: 'create invoice',
  },
};

export const INFURA_AUTH = `Basic ${Buffer.from(
  `${INFURA_PROJECT_ID}:${INFURA_PROJECT_SECRET}`,
).toString('base64')}`;

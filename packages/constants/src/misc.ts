// import { Address } from 'viem';

// TODO look at overlap with utils/web3.ts
// import { getKeys } from '../utils/getKeys';
import { CONFIG } from './config';

const INFURA_PROJECT_ID = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
const INFURA_PROJECT_SECRET = process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET;

const { INFURA_ID, IPFS_ENDPOINT, BOX_ENDPOINT, NETWORK_CONFIG } = CONFIG;

export { BOX_ENDPOINT, INFURA_ID, IPFS_ENDPOINT };

export const DEFAULT_CHAIN_ID = 5;

// TODO use wagmi Chain objects

export const graphUrls = (chainId: number) => NETWORK_CONFIG[chainId].SUBGRAPH;

export const resolvers = (chainId: number) =>
  Object.keys(NETWORK_CONFIG[chainId].RESOLVERS);

export const resolverInfo = (chainId: number) =>
  NETWORK_CONFIG[chainId].RESOLVERS;

export const wrappedNativeToken = (chainId: number) =>
  NETWORK_CONFIG[chainId].WRAPPED_NATIVE_TOKEN;

export const invoiceFactory = (chainId: number) =>
  NETWORK_CONFIG[chainId].INVOICE_FACTORY;

// TODO fix (import - getKeys)
// export const SUPPORTED_NETWORKS = getKeys(NETWORK_CONFIG).map(k => Number(k));
export const SUPPORTED_NETWORKS = [1, 100, 137];

export const INVOICE_VERSION = 'smart-invoice-v0';

export const INFURA_AUTH = `Basic ${Buffer.from(
  `${INFURA_PROJECT_ID}:${INFURA_PROJECT_SECRET}`,
).toString('base64')}`;

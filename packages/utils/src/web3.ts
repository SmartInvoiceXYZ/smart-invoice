import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import _ from 'lodash';
import { type Chain } from 'viem';
import { cookieStorage, createStorage } from 'wagmi';
import { gnosis, mainnet, polygon, polygonMumbai, sepolia } from 'wagmi/chains';
const APP_NAME = 'Smart Invoice';
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '';

const mainnetChains = [1, 100, 137];
const testnetChains = [5, 80001];
const orderedChains = _.concat(mainnetChains, testnetChains);

export const chainsList: { [key: number]: Chain } = {
  1: mainnet,
  11155111: sepolia,
  100: gnosis,
  137: polygon,
  80001: polygonMumbai,
};

const chainsOrdered: Chain[] = [
  mainnet,
  sepolia,
  gnosis,
  polygon,
  polygonMumbai,
];

export const chainsMap = (chainId: number) => {
  if (!chainId) {
    return null;
  }
  const chain = chainsList[chainId];
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }
  return chain;
};

export const chainByName = (name: string | undefined) => {
  if (!name) return null;
  const chain = _.find(_.values(chainsList), { network: name });
  if (!chain) throw new Error(`Chain ${name} not found`);
  return chain;
};

const chains = _.map(orderedChains, 'id');

const metadata = {
  name: APP_NAME,
  description: APP_NAME,
  url: 'http://localhost:3000', // origin must match your domain & subdomain
  icons: ['/favicon.ico'],
};

export const config = defaultWagmiConfig({
  chains: [...chainsOrdered] as any,
  projectId: PROJECT_ID,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

const createWeb3ModalThing = () =>
  createWeb3Modal({
    wagmiConfig: config,
    projectId: PROJECT_ID,
    enableAnalytics: false,
  });

export { chains, createWeb3ModalThing, config as wagmiConfig };

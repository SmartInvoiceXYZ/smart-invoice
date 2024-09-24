import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  injectedWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import _ from 'lodash';
import { Chain, http, Transport } from 'viem';
import { Config } from 'wagmi';
import {
  arbitrum,
  base,
  gnosis,
  holesky,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

const APP_NAME = 'Smart Invoice';
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '';
const INFURA_ID = process.env.NEXT_PUBLIC_INFURA_ID || '';

const infuraNetworkName: { [key: number]: string } = {
  [mainnet.id]: 'mainnet',
  [polygon.id]: 'polygon-mainnet',
  [arbitrum.id]: 'arbitrum-mainnet',
  [optimism.id]: 'optimism-mainnet',
  [sepolia.id]: 'sepolia',
  [base.id]: 'base-mainnet',
  [holesky.id]: 'holesky',
};

type _chains = readonly [Chain, ...Chain[]];
type _transports = Record<_chains[number]['id'], Transport>;

const chains: _chains = [
  mainnet,
  gnosis,
  polygon,
  arbitrum,
  optimism,
  base,
  holesky,
  sepolia,
];

type ChainsList = { [key: number]: Chain };

export const chainsList: ChainsList = chains.reduce(
  (acc: ChainsList, chain: Chain) => ({
    ...acc,
    [chain.id]: chain,
  }),
  {} as ChainsList,
);

export const chainsMap = (chainId: number): Chain => {
  const chain = chainsList[chainId];
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }
  return chain;
};

export const chainByName = (name?: string): Chain | null => {
  if (!name) return null;

  const chain = chains.find((c: Chain) => c.name.toLowerCase().includes(name));
  if (!chain) throw new Error(`Chain ${name} not found`);

  return chain;
};

const transports: _transports = chains.reduce(
  (acc: _transports, chain: Chain) => {
    const infuraNetwork = infuraNetworkName[chain.id];
    if (!infuraNetwork) {
      return {
        ...acc,
        [chain.id]: http(),
      };
    }

    return {
      ...acc,
      [chain.id]: http(`https://${infuraNetwork}.infura.io/v3/${INFURA_ID}`),
    };
  },
  {} as _transports,
);

const wagmiConfig: Config<_chains, _transports> = getDefaultConfig({
  ssr: true,
  appName: APP_NAME,
  projectId: PROJECT_ID,
  chains,
  transports,
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet,
        rainbowWallet,
        ledgerWallet,
        safeWallet,
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
});

export { chains, wagmiConfig };

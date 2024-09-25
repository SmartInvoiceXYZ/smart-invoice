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
import { Config, fallback } from 'wagmi';
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
const ALCHEMY_ID = process.env.NEXT_PUBLIC_ALCHEMY_ID || '';

const infuraNetworkName: { [key: number]: string } = {
  [mainnet.id]: 'mainnet',
  [polygon.id]: 'polygon-mainnet',
  [arbitrum.id]: 'arbitrum-mainnet',
  [optimism.id]: 'optimism-mainnet',
  [sepolia.id]: 'sepolia',
  [base.id]: 'base-mainnet',
  [holesky.id]: 'holesky',
};

const alchemyNetworkName: { [key: number]: string } = {
  [mainnet.id]: 'eth-mainnet',
  [polygon.id]: 'polygon-mainnet',
  [arbitrum.id]: 'arb-mainnet',
  [optimism.id]: 'opt-mainnet',
  [sepolia.id]: 'eth-sepolia',
  [base.id]: 'base-mainnet',
  [holesky.id]: 'eth-holesky',
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
    const infuraUrl =
      infuraNetwork && INFURA_ID
        ? `https://${infuraNetwork}.infura.io/v3/${INFURA_ID}`
        : '';
    const alchemyNetwork = alchemyNetworkName[chain.id];
    const alchemyUrl =
      alchemyNetwork && ALCHEMY_ID
        ? `https://${alchemyNetwork}.g.alchemy.com/v2/${ALCHEMY_ID}`
        : '';

    const list = [http()];
    if (infuraUrl) list.push(http(infuraUrl));
    if (alchemyUrl) list.push(http(alchemyUrl));

    return {
      ...acc,
      [chain.id]: fallback(list.reverse()),
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

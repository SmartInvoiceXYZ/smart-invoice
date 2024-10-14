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
import {
  isSupportedChainId,
  SUPPORTED_CHAINS,
  SupportedChain,
  SupportedChainId,
} from '@smartinvoicexyz/constants';
import _ from 'lodash';
import { Chain, http, Transport } from 'viem';
import { fallback } from 'wagmi';
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
const PORTERS_ID = process.env.NEXT_PUBLIC_PORTERS_ID || '';

const infuraNetworkName: Partial<Record<SupportedChainId, string>> = {
  [mainnet.id]: 'mainnet',
  [polygon.id]: 'polygon-mainnet',
  [arbitrum.id]: 'arbitrum-mainnet',
  [optimism.id]: 'optimism-mainnet',
  [sepolia.id]: 'sepolia',
  [base.id]: 'base-mainnet',
  [holesky.id]: 'holesky',
  // gnosis is not supported by infura
};

const alchemyNetworkName: Partial<Record<SupportedChainId, string>> = {
  [mainnet.id]: 'eth-mainnet',
  [polygon.id]: 'polygon-mainnet',
  [arbitrum.id]: 'arb-mainnet',
  [optimism.id]: 'opt-mainnet',
  [sepolia.id]: 'eth-sepolia',
  [base.id]: 'base-mainnet',
  [holesky.id]: 'eth-holesky',
  // gnosis is not supported by alchemy
};

const portersNetworkName: Partial<Record<SupportedChainId, string>> = {
  [mainnet.id]: 'eth-mainnet',
  [polygon.id]: 'poly-mainnet',
  [arbitrum.id]: 'arbitrum-one',
  [optimism.id]: 'optimism-mainnet',
  [sepolia.id]: 'sepolia-testnet',
  [base.id]: 'base-fullnode-mainnet',
  [holesky.id]: 'holesky-fullnode-testnet',
  [gnosis.id]: 'gnosischain-mainnet',
};

const subgraphNameToChain: Record<string, SupportedChain> = {
  mainnet,
  matic: polygon,
  'arbitrum-one': arbitrum,
  optimism,
  sepolia,
  base,
  holesky,
  gnosis,
};

type ChainsMap = Record<SupportedChainId, SupportedChain>;

const chainsMap: ChainsMap = SUPPORTED_CHAINS.reduce(
  (acc: ChainsMap, chain: Chain) => ({
    ...acc,
    [chain.id]: chain,
  }),
  {} as ChainsMap,
);

export const chainById = (chainId: SupportedChainId): Chain => {
  const chain = chainsMap[chainId];
  return chain;
};

export const getChainName = (chainId: number | undefined): string => {
  if (!isSupportedChainId(chainId)) return 'Unknown';
  return chainById(chainId).name;
};

export const chainByName = (name?: string): SupportedChain | undefined => {
  if (!name) return undefined;

  const subgraphChain = subgraphNameToChain[name.toLowerCase()];
  if (subgraphChain) return subgraphChain;

  return SUPPORTED_CHAINS.find(chain =>
    chain.name.toLowerCase().includes(name.toLowerCase()),
  );
};

type _transports = Record<SupportedChainId, Transport>;

const transports: _transports = SUPPORTED_CHAINS.reduce(
  (acc: _transports, chain: SupportedChain) => {
    const list = [http()];

    const infuraNetwork = infuraNetworkName[chain.id];
    const infuraUrl =
      infuraNetwork && INFURA_ID
        ? `https://${infuraNetwork}.infura.io/v3/${INFURA_ID}`
        : undefined;
    if (infuraUrl) list.push(http(infuraUrl));

    const alchemyNetwork = alchemyNetworkName[chain.id];
    const alchemyUrl =
      alchemyNetwork && ALCHEMY_ID
        ? `https://${alchemyNetwork}.g.alchemy.com/v2/${ALCHEMY_ID}`
        : undefined;
    if (alchemyUrl) list.push(http(alchemyUrl));

    const portersNetwork = portersNetworkName[chain.id];
    const portersUrl = portersNetwork
      ? `https://${portersNetwork}.rpc.porters.xyz/${PORTERS_ID}`
      : undefined;
    if (portersUrl) list.push(http(portersUrl));

    return {
      ...acc,
      [chain.id]: fallback(list.reverse()),
    };
  },
  {} as _transports,
);

const wagmiConfig = getDefaultConfig({
  ssr: true,
  appName: APP_NAME,
  projectId: PROJECT_ID,
  chains: SUPPORTED_CHAINS,
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

export { wagmiConfig };

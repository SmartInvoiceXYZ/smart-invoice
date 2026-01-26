import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
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
  BASE_URL,
  isSupportedChainId,
  SUPPORTED_CHAINS,
  SupportedChain,
  SupportedChainId,
} from '@smartinvoicexyz/constants';
import _ from 'lodash';
import { Chain, createPublicClient, http, PublicClient, Transport } from 'viem';
import { createConfig, CreateConnectorFn, fallback } from 'wagmi';
import {
  arbitrum,
  base,
  gnosis,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

const APP_NAME = 'Smart Invoice';
const APP_DESCRIPTION =
  'Smart Invoice is an easy-to-use tool that provides web3 freelancers with cryptocurrency invoicing, escrow, and arbitration.';
const APP_ICON = `${BASE_URL}/favicon-32x32.png`;
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '';
const INFURA_ID = process.env.NEXT_PUBLIC_INFURA_ID || '';
const ALCHEMY_ID = process.env.NEXT_PUBLIC_ALCHEMY_ID || '';

const infuraNetworkName: Partial<Record<SupportedChainId, string>> = {
  [mainnet.id]: 'mainnet',
  [polygon.id]: 'polygon-mainnet',
  [arbitrum.id]: 'arbitrum-mainnet',
  [optimism.id]: 'optimism-mainnet',
  [sepolia.id]: 'sepolia',
  [base.id]: 'base-mainnet',
  // gnosis is not supported by infura
};

const alchemyNetworkName: Partial<Record<SupportedChainId, string>> = {
  [mainnet.id]: 'eth-mainnet',
  [polygon.id]: 'polygon-mainnet',
  [arbitrum.id]: 'arb-mainnet',
  [optimism.id]: 'opt-mainnet',
  [sepolia.id]: 'eth-sepolia',
  [base.id]: 'base-mainnet',
  // gnosis is not supported by alchemy
};

const chainLabelToId: Record<string, SupportedChainId> = {
  mainnet: mainnet.id,
  sepolia: sepolia.id,
  polygon: polygon.id,
  base: base.id,
  arbitrum: arbitrum.id,
  optimism: optimism.id,
  gnosis: gnosis.id,
};

const chainIdToLabel: Record<SupportedChainId, string> = {
  [mainnet.id]: 'mainnet',
  [polygon.id]: 'polygon',
  [arbitrum.id]: 'arbitrum',
  [optimism.id]: 'optimism',
  [sepolia.id]: 'sepolia',
  [base.id]: 'base',
  [gnosis.id]: 'gnosis',
};

const subgraphNameToChain: Record<string, SupportedChain> = {
  mainnet,
  matic: polygon,
  'arbitrum-one': arbitrum,
  optimism,
  sepolia,
  base,
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

export const chainIdFromLabel = (
  label: string,
): SupportedChainId | undefined => {
  const chainId = chainLabelToId[label.toLowerCase()];
  return chainId;
};

export const chainLabelFromId = (chainId: SupportedChainId): string => {
  const label = chainIdToLabel[chainId];
  return label;
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

    return {
      ...acc,
      [chain.id]: fallback(list.reverse()),
    };
  },
  {} as _transports,
);

export const publicClients: Record<SupportedChainId, PublicClient> =
  SUPPORTED_CHAINS.reduce(
    (acc: Record<SupportedChainId, PublicClient>, chain: SupportedChain) => {
      const transport = transports[chain.id];
      const client = createPublicClient({ chain, transport });
      return {
        ...acc,
        [chain.id]: client,
      };
    },
    {} as Record<SupportedChainId, PublicClient>,
  );

export const serverConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  transports,
});

const metadata = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: BASE_URL,
  icons: [APP_ICON],
};

const rainbowConnectors = connectorsForWallets(
  [
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
  {
    projectId: PROJECT_ID,
    appName: APP_NAME,
    appDescription: APP_DESCRIPTION,
    appUrl: BASE_URL,
    appIcon: APP_ICON,
    walletConnectParameters: { metadata },
  },
);

const connectors: CreateConnectorFn[] = [
  ...rainbowConnectors,
  miniAppConnector as unknown as CreateConnectorFn,
];

export const wagmiConfig = createConfig({
  ssr: true,
  chains: SUPPORTED_CHAINS,
  transports,
  connectors,
});

export const parseChainId = (
  chainIdOrLabel: string | string[] | undefined,
): number | undefined => {
  if (!chainIdOrLabel) return undefined;
  // eslint-disable-next-line no-param-reassign
  chainIdOrLabel = chainIdOrLabel.toString();
  if (chainIdOrLabel.startsWith('0x')) return parseInt(chainIdOrLabel, 16);
  if (Number.isInteger(Number(chainIdOrLabel))) return Number(chainIdOrLabel);
  const chainId = chainIdFromLabel(chainIdOrLabel.toLowerCase());
  if (chainId) return chainId;
  // eslint-disable-next-line no-param-reassign
  chainIdOrLabel = `0x${chainIdOrLabel}`;
  return parseInt(chainIdOrLabel, 16);
};

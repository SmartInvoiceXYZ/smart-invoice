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
import _ from 'lodash';
import { Chain, configureChains, createConfig } from 'wagmi';
import {
  arbitrum,
  base,
  gnosis as defaultGnosis,
  holesky,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';

const APP_NAME = 'Smart Invoice';
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '';

const gnosis = {
  ...defaultGnosis,
  hasIcon: true,
  iconUrl: '/chains/gnosis.png',
  iconBackground: 'none',
};

const mainnetChains = [
  mainnet.id,
  gnosis.id,
  polygon.id,
  arbitrum.id,
  optimism.id,
  base.id,
];
const testnetchains = [sepolia.id, holesky.id];
const orderedChains = [...mainnetChains, ...testnetchains];

export const chainsList: { [key: number]: Chain } = {
  [mainnet.id]: mainnet,
  [gnosis.id]: gnosis,
  [polygon.id]: polygon,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [sepolia.id]: sepolia,
  [base.id]: base,
  [holesky.id]: holesky,
};

export const chainsMap = (chainId: number) => {
  const chain = chainsList[chainId];
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }
  return chain;
};

export const chainByName = (name?: string): Chain | null => {
  if (!name) return null;

  if (name === 'mainnet') {
    return mainnet;
  }

  if (name.startsWith('arbitrum')) {
    return arbitrum;
  }

  const chain = _.find(_.values(chainsList), { network: name });
  if (!chain) throw new Error(`Chain ${name} not found`);
  return chain;
};

const { chains, publicClient } = configureChains(
  _.compact(_.map(orderedChains, chainId => chainsMap(chainId))),
  [
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_ID || '' }),
    publicProvider(),
  ],
);
const options = {
  appName: APP_NAME,
  projectId: PROJECT_ID,
  chains,
};

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains, shimDisconnect: true }),
      rainbowWallet({ chains, projectId: PROJECT_ID }),
      ledgerWallet({ chains, projectId: PROJECT_ID }),
      safeWallet({ chains }),
      metaMaskWallet({ chains, projectId: PROJECT_ID }),
      coinbaseWallet({ appName: APP_NAME, chains }),
      walletConnectWallet({ chains, projectId: PROJECT_ID, options }),
    ],
  },
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains, wagmiConfig };

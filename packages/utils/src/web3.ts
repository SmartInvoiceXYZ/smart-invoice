import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  injectedWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import _ from 'lodash';
import { Chain, configureChains, createConfig } from 'wagmi';
import {
  gnosis as defaultGnosis,
  goerli,
  mainnet,
  polygon,
  polygonMumbai,
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

const mainnetChains = [1, 100, 137];
const testnetChains = [5, 80001];
const orderedChains = _.concat(mainnetChains, testnetChains);

export const chainsList: { [key: number]: Chain } = {
  1: mainnet,
  5: goerli,
  100: gnosis,
  137: polygon,
  80001: polygonMumbai,
};

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

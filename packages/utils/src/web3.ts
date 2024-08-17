import _ from 'lodash';
import { Chain,} from 'wagmi';
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
import { http } from '@wagmi/core'
import { fallback } from 'viem';
import { getDefaultConfig, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet, rainbowWallet, ledgerWallet, safeWallet, metaMaskWallet, coinbaseWallet, walletConnectWallet, argentWallet } from '@rainbow-me/rainbowkit/wallets';


const APP_NAME = 'Smart Invoice';
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '';
const GROVE_KEY = process.env.NEXT_PUBLIC_GROVE_KEY || '';

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
    return arbitrum
  }

  const chain = _.find(_.values(chainsList), { network: name });
  if (!chain) throw new Error(`Chain ${name} not found`);
  return chain;
};

const chains = orderedChains.map(chainId => chainsMap(chainId));

const options = {
  appName: APP_NAME,
  projectId: PROJECT_ID,
  chains,
};

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, walletConnectWallet],
    },
    {
      groupName: 'Others',
      wallets: [injectedWallet, safeWallet, ledgerWallet, metaMaskWallet, argentWallet], 
    }
  ],
  {
    appName: APP_NAME,
    projectId: PROJECT_ID,
  }
);

const transports = {
   [arbitrum.id]: fallback([
     http(`https://arbitrum-one.rpc.grove.city/v1/${GROVE_KEY}`),
     http()
   ]),
   [base.id]: fallback([
     http(`https://base-mainnet.rpc.grove.city/v1/${GROVE_KEY}`), 
     http()
   ]),
   [gnosis.id]: fallback([
     http(`https://gnosischain-mainnet.rpc.grove.city/v1/${GROVE_KEY}`), 
     http()
   ]),
   [polygon.id]: fallback([
     http(`https://poly-mainnet.rpc.grove.city/v1/${GROVE_KEY}`),
     http()
   ]),
   [sepolia.id]: fallback([
     http(`https://sepolia.rpc.grove.city/v1/${GROVE_KEY}`),
     http()
   ]),
   [holesky.id]: fallback([
     http(`https://holesky-fullnode-testnet.rpc.grove.city/v1/${GROVE_KEY}`),
     http()
   ]),
   [mainnet.id]: fallback([
     http(`https://eth-mainnet.rpc.grove.city/v1/${GROVE_KEY}`),
     http()
   ]),
}

const wagmiConfig = getDefaultConfig({
  ...options,
  transports,
  connectors,
});

export { chains, wagmiConfig };

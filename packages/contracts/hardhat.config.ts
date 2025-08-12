import '@nomicfoundation/hardhat-toolbox-viem';
import '@nomicfoundation/hardhat-foundry';
import 'hardhat-chai-matchers-viem';

import dotenv from 'dotenv';
import type { HardhatUserConfig } from 'hardhat/config';

dotenv.config();

const {
  INFURA_PROJECT_ID,
  PRIVATE_KEY,
  MNEMONIC,
  ETHERSCAN_API_KEY,
  COINMARKETCAP_API_KEY,
  CURRENCY,
  POLYGONSCAN_API_KEY,
  GNOSISSCAN_API_KEY,
  OPTIMISTIC_ETHERSCAN_API_KEY,
  ARBISCAN_API_KEY,
  BASESCAN_API_KEY,
  ZORAENERGY_API_KEY,
} = process.env;

let accounts: string[] | { mnemonic: string } | undefined;

if (MNEMONIC) {
  accounts = { mnemonic: MNEMONIC };
} else if (PRIVATE_KEY) {
  accounts = [PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`];
}

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.30',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    gnosis: {
      chainId: 100,
      url: `https://1rpc.io/gnosis`,
      accounts,
    },
    sepolia: {
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    holesky: {
      chainId: 17000,
      url: `https://holesky.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    polygon: {
      chainId: 137,
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    optimisticEthereum: {
      chainId: 10,
      url: `https://optimism-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    optimismSepolia: {
      chainId: 11155420,
      url: `https://optimism-sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    arbitrumOne: {
      chainId: 42161,
      url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    arbitrumSepolia: {
      chainId: 421614,
      url: `https://arbitrum-sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    base: {
      chainId: 8453,
      url: `https://base-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    baseSepolia: {
      chainId: 84532,
      url: `https://base-sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    zora: {
      url: `https://rpc.zora.energy/`,
      chainId: 7777777,
      accounts,
    },
    zoraSepolia: {
      url: `https://sepolia.rpc.zora.energy`,
      chainId: 999999999,
      accounts,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      chainId: 1,
      accounts,
    },
    hardhat: {
      chainId: 31337,
      forking: {
        enabled: process.env.FORK === 'true',
        url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      },
    },
    anvil: {
      chainId: 31337,
      url: 'http://127.0.0.1:8545',
    },
  },
  etherscan: {
    apiKey: {
      gnosis: GNOSISSCAN_API_KEY!,
      xdai: GNOSISSCAN_API_KEY!,
      sepolia: ETHERSCAN_API_KEY!,
      holesky: ETHERSCAN_API_KEY!,
      polygon: POLYGONSCAN_API_KEY!,
      optimisticEthereum: OPTIMISTIC_ETHERSCAN_API_KEY!,
      optimismSepolia: OPTIMISTIC_ETHERSCAN_API_KEY!,
      arbitrumOne: ARBISCAN_API_KEY!,
      arbitrumSepolia: ARBISCAN_API_KEY!,
      mainnet: ETHERSCAN_API_KEY!,
      base: BASESCAN_API_KEY!,
      baseSepolia: BASESCAN_API_KEY!,
      zora: ZORAENERGY_API_KEY!,
      zoraSepolia: ZORAENERGY_API_KEY!,
    },
    customChains: [
      {
        network: 'optimismSepolia',
        chainId: 11155420,
        urls: {
          apiURL: 'https://api-sepolia-optimistic.etherscan.io/api',
          browserURL: 'https://sepolia-optimistic.etherscan.io',
        },
      },
      {
        network: 'zora',
        chainId: 7777777,
        urls: {
          apiURL: 'https://explorer.zora.energy/api',
          browserURL: 'https://explorer.zora.energy',
        },
      },
      {
        network: 'zoraSepolia',
        chainId: 999999999,
        urls: {
          apiURL: 'https://sepolia.explorer.zora.energy/api',
          browserURL: 'https://sepolia.explorer.zora.energy',
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
    currency: CURRENCY,
  },
};

export default config;

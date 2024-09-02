require("hardhat/config");
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
require("@nomiclabs/hardhat-ganache");
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-interface-generator");

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
} = process.env;

if (!PRIVATE_KEY && !MNEMONIC) {
  console.error("invalid env variable: PRIVATE_KEY or MNEMONIC");
  process.exit(1);
}

const accounts = MNEMONIC
  ? { mnemonic: MNEMONIC }
  : [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`];

module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    artifacts: "./build",
  },
  networks: {
    gnosis: {
      url: `https://rpc.ankr.com/gnosis`,
      accounts,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    holesky: {
      url: `https://holesky.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    optimisticEthereum: {
      url: `https://optimism-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    arbitrumOne: {
      url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    base: {
      url: `https://base-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    hardhat: {
      forking: {
        enabled: process.env.FORK ? process.env.FORK === "true" : false,
        url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      },
    },
    ganache: {
      url: "http://127.0.0.1:8555",
      defaultBalanceEther: 1000,
    },
  },
  etherscan: {
    apiKey: {
      gnosis: GNOSISSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      holesky: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      optimisticEthereum: OPTIMISTIC_ETHERSCAN_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
      base: BASESCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
    currency: CURRENCY,
  },
};

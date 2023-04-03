require("hardhat/config");
require("dotenv").config();
require("@nomiclabs/hardhat-ganache");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("./tasks/verify-blockscout");

const {
  INFURA_PROJECT_ID,
  PRIVATE_KEY,
  ETHERSCAN_API_KEY,
  COINMARKETCAP_API_KEY,
  CURRENCY,
  POLYGONSCAN_API_KEY,
} = process.env;

module.exports = {
  solidity: {
    version: "0.8.3",
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
    sokol: {
      url: `https://sokol.poa.network`,
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: 1000000000,
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
      etherscan: {
        apiKey: POLYGONSCAN_API_KEY,
      },
    },
    xdai: {
      url: `https://rpc.ankr.com/gnosis`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    ganache: {
      url: "http://127.0.0.1:8555",
      defaultBalanceEther: 1000,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: 4500000000,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    // enabled: false,
    coinmarketcap: COINMARKETCAP_API_KEY,
    currency: CURRENCY,
  },
};

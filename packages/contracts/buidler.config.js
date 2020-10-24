const {usePlugin} = require("@nomiclabs/buidler/config");
require("dotenv").config();

usePlugin("@nomiclabs/buidler-ganache");
usePlugin("@nomiclabs/buidler-ethers");

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solc: {
    version: "0.7.0",
  },
  paths: {
    artifacts: "./build",
  },
  networks: {
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    ganache: {
      url: "http://127.0.0.1:8555",
      defaultBalanceEther: 1000,
    },
  },
};

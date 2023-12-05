const goerli = require("../deployments/goerli.json");
const localhost = require("../deployments/localhost.json");
const gnosis = require("../deployments/gnosis.json");
const polygon = require("../deployments/polygon.json");
const mumbai = require("../deployments/polygonMumbai.json");
const mainnet = require("../deployments/mainnet.json");

const NETWORK_DATA = {
  1: {
    name: "mainnet",
    wrappedTokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    networkCurrency: "ETH",
    factory: mainnet.factory,
  },
  5: {
    name: "goerli",
    wrappedTokenAddress: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    networkCurrency: "ETH",
    factory: goerli.factory,
    zap: goerli.zap,
    spoilsManager: goerli.spoilsManager,
  },
  // 77: {
  //   name: "sokol",
  //   wrappedTokenAddress: "0xc655c6D80ac92d75fBF4F40e95280aEb855B1E87",
  //   networkCurrency: "SPOA",
  // },
  100: {
    name: "gnosis",
    wrappedTokenAddress: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
    networkCurrency: "xDai",
    factory: gnosis.factory,
    zap: gnosis.zap,
    spoilsManager: gnosis.spoilsManager,
    useBlockscout: true,
  },
  137: {
    name: "polygon",
    wrappedTokenAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    networkCurrency: "MATIC",
    factory: polygon.factory,
    zap: polygon.zap,
    spoilsManager: polygon.spoilsManager,
  },
  31337: {
    name: "localhost",
    wrappedTokenAddress: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
    networkCurrency: "hhETH",
    factory: localhost.factory,
    zap: localhost.zap,
    spoilsManager: localhost.spoilsManager,
  },
  80001: {
    name: "mumbai",
    wrappedTokenAddress: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
    networkCurrency: "MATIC",
    factory: mumbai.factory,
    zap: mumbai.zap,
    spoilsManager: mumbai.spoilsManager,
  },
};

const getNetworkData = chainId => NETWORK_DATA[chainId];
const getNetworkName = chainId => getNetworkData(chainId).name;
const getNetworkCurrency = chainId => getNetworkData(chainId).networkCurrency;
const getWrappedTokenAddress = chainId =>
  getNetworkData(chainId).wrappedTokenAddress;
const getFactory = chainId => getNetworkData(chainId).factory;
const getUseBlockscout = chainId => getNetworkData(chainId).useBlockscout;
const getZapData = chainId => getNetworkData(chainId).zap;
const getSpoilsManagerData = chainId => getNetworkData(chainId).spoilsManager;

module.exports = {
  getNetworkData,
  getNetworkName,
  getNetworkCurrency,
  getWrappedTokenAddress,
  getFactory,
  getUseBlockscout,
  getZapData,
  getSpoilsManagerData,
};

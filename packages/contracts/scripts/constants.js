const localhost = require("../deployments/localhost.json");
const gnosis = require("../deployments/gnosis.json");
const polygon = require("../deployments/polygon.json");
const mainnet = require("../deployments/mainnet.json");
const sepolia = require("../deployments/sepolia.json");
const holesky = require("../deployments/holesky.json");
const arbitrumOne = require("../deployments/arbitrumOne.json");
const base = require("../deployments/base.json");
const optimisticEthereum = require("../deployments/optimisticEthereum.json");

const NETWORK_DATA = {
  1: {
    name: "mainnet",
    wrappedTokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    networkCurrency: "ETH",
    factory: mainnet.factory,
  },
  11155111: {
    name: "sepolia",
    wrappedTokenAddress: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    networkCurrency: "sETH",
    factory: sepolia.factory,
    zap: sepolia.zap,
    spoilsManager: sepolia.spoilsManager,
  },
  17000: {
    name: "holesky",
    wrappedTokenAddress: "0x94373a4919b3240d86ea41593d5eba789fef3848",
    networkCurrency: "hETH",
    factory: holesky.factory,
    zap: holesky.zap,
    spoilsManager: holesky.spoilsManager,
  },
  8453: {
    name: "base",
    wrappedTokenAddress: "0x4200000000000000000000000000000000000006",
    networkCurrency: "ETH",
    factory: base.factory,
    zap: base.zap,
    spoilsManager: base.spoilsManager,
  },
  42161: {
    name: "arbitrumOne",
    wrappedTokenAddress: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    networkCurrency: "ETH",
    factory: arbitrumOne.factory,
    zap: arbitrumOne.zap,
    spoilsManager: arbitrumOne.spoilsManager,
  },
  10: {
    name: "optimisticEthereum",
    wrappedTokenAddress: "0x4200000000000000000000000000000000000006",
    networkCurrency: "ETH",
    factory: optimisticEthereum.factory,
    zap: optimisticEthereum.zap,
    spoilsManager: optimisticEthereum.spoilsManager,
  },
  100: {
    name: "gnosis",
    wrappedTokenAddress: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
    networkCurrency: "xDai",
    factory: gnosis.factory,
    zap: gnosis.zap,
    spoilsManager: gnosis.spoilsManager,
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

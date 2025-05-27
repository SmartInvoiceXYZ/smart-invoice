import { Hex } from 'viem'; // Importing Hex type from viem

import arbitrumOneDeployment from '../deployments/arbitrumOne.json';
import arbitrumSepoliaDeployment from '../deployments/arbitrumSepolia.json';
import baseDeployment from '../deployments/base.json';
import baseSepoliaDeployment from '../deployments/baseSepolia.json';
import gnosisDeployment from '../deployments/gnosis.json';
import holeskyDeployment from '../deployments/holesky.json';
import mainnetDeployment from '../deployments/mainnet.json';
import optimismSepoliaDeployment from '../deployments/optimismSepolia.json';
import optimisticEthereumDeployment from '../deployments/optimisticEthereum.json';
import polygonDeployment from '../deployments/polygon.json';
import sepoliaDeployment from '../deployments/sepolia.json';
import zoraDeployment from '../deployments/zora.json';
import zoraSepoliaDeployment from '../deployments/zoraSepolia.json';
import { DeploymentInfo } from './utils/types';

const arbitrumOne = arbitrumOneDeployment as DeploymentInfo;
const base = baseDeployment as DeploymentInfo;
const gnosis = gnosisDeployment as DeploymentInfo;
const holesky = holeskyDeployment as DeploymentInfo;
const localhost = localhostDeployment as DeploymentInfo;
const mainnet = mainnetDeployment as DeploymentInfo;
const optimisticEthereum = optimisticEthereumDeployment as DeploymentInfo;
const polygon = polygonDeployment as DeploymentInfo;
const sepolia = sepoliaDeployment as DeploymentInfo;

const baseSepolia = baseSepoliaDeployment as DeploymentInfo;
const optimismSepolia = optimismSepoliaDeployment as DeploymentInfo;
const zora = zoraDeployment as DeploymentInfo;
const zoraSepolia = zoraSepoliaDeployment as DeploymentInfo;
const arbitrumSepolia = arbitrumSepoliaDeployment as DeploymentInfo;

export type NetworkData = {
  name: string;
  wrappedTokenAddress: Hex;
  networkCurrency: string;
  factory: Hex;
  zap?: DeploymentInfo['zap'];
  spoilsManager?: DeploymentInfo['spoilsManager'];
};

// Define the NETWORK_DATA object with the appropriate types
export const NETWORK_DATA: Record<number, NetworkData> = {
  1: {
    name: 'mainnet',
    wrappedTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' as Hex,
    networkCurrency: 'ETH',
    factory: mainnet.factory as Hex,
  },
  11155111: {
    name: 'sepolia',
    wrappedTokenAddress: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as Hex,
    networkCurrency: 'sETH',
    factory: sepolia.factory as Hex,
    zap: sepolia.zap,
    spoilsManager: sepolia.spoilsManager,
  },
  17000: {
    name: 'holesky',
    wrappedTokenAddress: '0x94373a4919b3240d86ea41593d5eba789fef3848' as Hex,
    networkCurrency: 'hETH',
    factory: holesky.factory as Hex,
    zap: holesky.zap,
    spoilsManager: holesky.spoilsManager,
  },
  8453: {
    name: 'base',
    wrappedTokenAddress: '0x4200000000000000000000000000000000000006' as Hex,
    networkCurrency: 'ETH',
    factory: base.factory as Hex,
    zap: base.zap,
    spoilsManager: base.spoilsManager,
  },
  84532: {
    name: 'baseSepolia',
    wrappedTokenAddress: '0x4200000000000000000000000000000000000006' as Hex,
    networkCurrency: 'sETH',
    factory: baseSepolia.factory as Hex,
    zap: baseSepolia.zap,
    spoilsManager: baseSepolia.spoilsManager,
  },
  42161: {
    name: 'arbitrumOne',
    wrappedTokenAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1' as Hex,
    networkCurrency: 'ETH',
    factory: arbitrumOne.factory as Hex,
    zap: arbitrumOne.zap,
    spoilsManager: arbitrumOne.spoilsManager,
  },
  421614: {
    name: 'arbitrumSepolia',
    wrappedTokenAddress: '0x980b62da83eff3d4576c647993b0c1d7faf17c73' as Hex,
    networkCurrency: 'ETH',
    factory: arbitrumSepolia.factory as Hex,
    zap: arbitrumSepolia.zap,
    spoilsManager: arbitrumSepolia.spoilsManager,
  },
  10: {
    name: 'optimisticEthereum',
    wrappedTokenAddress: '0x4200000000000000000000000000000000000006' as Hex,
    networkCurrency: 'ETH',
    factory: optimisticEthereum.factory as Hex,
    zap: optimisticEthereum.zap,
    spoilsManager: optimisticEthereum.spoilsManager,
  },
  11155420: {
    name: 'optimismSepolia',
    wrappedTokenAddress: '0x4200000000000000000000000000000000000006' as Hex,
    networkCurrency: 'ETH',
    factory: optimismSepolia.factory as Hex,
    zap: optimismSepolia.zap,
    spoilsManager: optimismSepolia.spoilsManager,
  },
  100: {
    name: 'gnosis',
    wrappedTokenAddress: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d' as Hex,
    networkCurrency: 'xDai',
    factory: gnosis.factory as Hex,
    zap: gnosis.zap,
    spoilsManager: gnosis.spoilsManager,
  },
  137: {
    name: 'polygon',
    wrappedTokenAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' as Hex,
    networkCurrency: 'MATIC',
    factory: polygon.factory as Hex,
    zap: polygon.zap,
    spoilsManager: polygon.spoilsManager,
  },
  31337: {
    name: 'localhost',
    wrappedTokenAddress: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d' as Hex,
    networkCurrency: 'hhETH',
    factory: localhost.factory as Hex,
    zap: localhost.zap,
    spoilsManager: localhost.spoilsManager,
  },
  7777777: {
    name: 'zora',
    wrappedTokenAddress: '0x4200000000000000000000000000000000000006' as Hex,
    networkCurrency: 'ETH',
    factory: zora.factory as Hex,
    zap: zora.zap,
    spoilsManager: zora.spoilsManager,
  },
  999999999: {
    name: 'zoraSepolia',
    wrappedTokenAddress: '0x4200000000000000000000000000000000000006' as Hex,
    networkCurrency: 'ETH',
    factory: zoraSepolia.factory as Hex,
    zap: zoraSepolia.zap,
    spoilsManager: zoraSepolia.spoilsManager,
  },
};

// Functions to get network data
export const getNetworkData = (chainId: number): NetworkData =>
  NETWORK_DATA[chainId];
export const getNetworkName = (chainId: number): string =>
  getNetworkData(chainId).name;
export const getNetworkCurrency = (chainId: number): string =>
  getNetworkData(chainId).networkCurrency;
export const getWrappedTokenAddress = (chainId: number): Hex =>
  getNetworkData(chainId).wrappedTokenAddress;
export const getFactory = (chainId: number): Hex =>
  getNetworkData(chainId).factory;
export const getZapData = (chainId: number) => getNetworkData(chainId).zap;
export const getSpoilsManagerData = (chainId: number) =>
  getNetworkData(chainId).spoilsManager;

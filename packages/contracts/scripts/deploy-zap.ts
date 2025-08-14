import { network, viem } from 'hardhat';
import { encodeAbiParameters, Hex } from 'viem';

import { getFactory, getZapData } from './constants';
import {
  addDaoZap,
  addZap,
  readDeploymentInfo,
  writeDeploymentInfo,
} from './utils/file';
import { deployContract, verifyContract } from './utils/general';

const DAO_ZAP = true;
const INITIAL_SPOILS_BPS = 1000; // 10%
const INITIAL_DAO_RECEIVER = undefined;

async function main(): Promise<void> {
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();

  // Handle unsupported networks
  if (![5, 31337, 11155111, 100, 10].includes(chainId)) {
    console.log('Unsupported Network: ', chainId);
    return;
  }

  const zapData = getZapData(chainId);
  const deploymentInfo = readDeploymentInfo(network.name);
  const updateFactory = deploymentInfo;

  if (!zapData) {
    console.log('Zap data not found for network:', network.name);
    return;
  }

  if (DAO_ZAP) {
    const daoReceiver = INITIAL_DAO_RECEIVER ?? zapData.dao;
    const spoilsBPS = INITIAL_SPOILS_BPS;

    const encodedData = encodeAbiParameters(
      [
        { type: 'address' }, // safeSingleton
        { type: 'address' }, // fallbackHandler
        { type: 'address' }, // safeFactory
        { type: 'address' }, // splitMain
        { type: 'address' }, // escrowFactory
        { type: 'address' }, // dao
        { type: 'address' }, // daoReceiver
        { type: 'uint16' }, // spoilsBPS
      ],
      [
        zapData.safeSingleton as Hex, // singleton
        zapData.fallbackHandler as Hex, // fallback handler
        zapData.safeFactory as Hex, // safe factory
        zapData.splitMain as Hex, // split main
        getFactory(chainId) as Hex, // escrow factory
        zapData.dao as Hex, // dao, not used in regular zap
        daoReceiver as Hex, // dao receiver
        spoilsBPS,
      ],
    );

    const { contract: zap } = await deployContract('SafeSplitsDaoEscrowZap', [
      encodedData,
    ]);

    await verifyContract(chainId, zap.address, [encodedData]);

    console.log('SafeSplitsDaoEscrowZap Address:', zap.address);

    const updateInstance = addDaoZap(updateFactory, zap.address as Hex);

    writeDeploymentInfo(updateInstance, network.name);
  } else {
    const zapDeployData: Hex[] = [
      zapData.safeSingleton as Hex, // singleton
      zapData.fallbackHandler as Hex, // fallback handler
      zapData.safeFactory as Hex, // safe factory
      zapData.splitMain as Hex, // split main
      getFactory(chainId) as Hex, // escrow factory
    ];

    const encodedData = encodeAbiParameters(
      Array.from({ length: zapDeployData.length }, () => ({ type: 'address' })),
      zapDeployData,
    );

    const { contract: zap } = await deployContract('SafeSplitsEscrowZap', [
      encodedData,
    ]);

    await verifyContract(chainId, zap.address, [encodedData]);

    console.log('SafeSplitsEscrowZap Address:', zap.address);

    const updateInstance = addZap(updateFactory, zap.address as Hex);

    writeDeploymentInfo(updateInstance, network.name);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

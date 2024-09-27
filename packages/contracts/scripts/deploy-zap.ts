import { network, viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types/artifacts';
import { encodeAbiParameters, Hex, toBytes, toHex } from 'viem';

import { getFactory, getWrappedTokenAddress, getZapData } from './constants';
import {
  addZapFactory,
  addZapImplementation,
  addZapInstance,
  readDeploymentInfo,
  writeDeploymentInfo,
} from './utils/file';
import { deployContract, verifyContract } from './utils/general';

const DAO_ZAP = true;

async function main(): Promise<void> {
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  let zapFactoryInstance:
    | ContractTypesMap['SafeSplitsEscrowZapFactory']
    | null = null;

  // Handle unsupported networks
  if (![5, 31337, 100, 10].includes(chainId)) {
    console.log('Unsupported Network: ', chainId);
    return;
  }

  const zapData = getZapData(chainId);
  const deploymentInfo = readDeploymentInfo(network.name);
  let updateFactory = deploymentInfo;

  if (!zapData) {
    console.log('Zap data not found for network:', network.name);
    return;
  }

  if (!zapData.factory) {
    const contractName = DAO_ZAP
      ? 'SafeSplitsDaoEscrowZap'
      : 'SafeSplitsEscrowZap';
    const { contract: safeSplitsEscrowZapImpl } =
      await deployContract(contractName);

    console.log('Implementation Address:', safeSplitsEscrowZapImpl.address);

    await verifyContract(chainId, safeSplitsEscrowZapImpl.address, []);
    const updateImplementation = addZapImplementation(
      deploymentInfo,
      safeSplitsEscrowZapImpl.address,
    );

    const { contract } = await deployContract('SafeSplitsEscrowZapFactory', [
      safeSplitsEscrowZapImpl.address,
    ]);

    zapFactoryInstance = contract;

    if (!zapFactoryInstance) {
      console.log('Failed to deploy Safe-Splits-Escrow Zap Factory');
      return;
    }

    console.log(
      'Safe-Splits-Escrow Zap Factory Address:',
      zapFactoryInstance.address,
    );

    await verifyContract(chainId, zapFactoryInstance.address, [
      safeSplitsEscrowZapImpl.address,
    ]);

    updateFactory = addZapFactory(
      updateImplementation,
      zapFactoryInstance.address as Hex,
    );
  } else if (!zapFactoryInstance) {
    zapFactoryInstance = (await viem.getContractAt(
      'SafeSplitsEscrowZapFactory',
      zapData.factory,
    )) as ContractTypesMap['SafeSplitsEscrowZapFactory'];
  }

  if (!zapFactoryInstance) {
    console.log('Failed to get Safe-Splits-Escrow Zap Factory');
    return;
  }

  // Regular zap = 6 params, DAO zap = 8 params
  // Deploy a new zap instance
  const zapDeployData: Hex[] = [
    zapData.safeSingleton as Hex, // singleton
    zapData.fallbackHandler as Hex, // fallback handler
    zapData.safeFactory as Hex, // safe factory
    zapData.splitMain as Hex, // split main
    zapData.spoilsManager as Hex, // spoils manager, not used in regular zap
    getFactory(chainId) as Hex, // escrow factory
    getWrappedTokenAddress(chainId) as Hex, // wrapped token
    zapData.dao as Hex, // dao, not used in regular zap
  ];

  const encodedData = encodeAbiParameters(
    Array.from({ length: zapDeployData.length }, () => ({ type: 'address' })),
    zapDeployData,
  );

  const saltNonce = toHex(
    toBytes(Math.floor(new Date().getTime() / 1000), {
      size: 32,
    }),
  );

  const zapInstanceTxHash =
    await zapFactoryInstance.write.createSafeSplitsEscrowZap([
      encodedData,
      saltNonce,
    ]);

  const safeSplitsEscrowZap = await publicClient.waitForTransactionReceipt({
    hash: zapInstanceTxHash,
  });

  console.log(
    'Safe-Splits-Escrow Zap Instance Address:',
    safeSplitsEscrowZap.logs[0].address,
  );

  const updateInstance = addZapInstance(
    updateFactory,
    safeSplitsEscrowZap.logs[0].address as Hex,
  );

  writeDeploymentInfo(updateInstance, network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

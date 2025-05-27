import { network, viem } from 'hardhat';
import { Hex, toBytes, toHex } from 'viem';

import { getSpoilsManagerData, getZapData } from './constants';
import {
  addSpoilsManagerInstance,
  readDeploymentInfo,
  updateSpoilsManager,
  writeDeploymentInfo,
} from './utils/file';
import { deployContract, verifyContract } from './utils/general';
import { SpoilsManager } from './utils/types';

const INITIAL_SPOILS = 10; // out of 100 multiplied by scale used in SplitMain
const PERCENTAGE_SCALE = 1e4; // percentage scale from SplitMain
const INITIAL_RECEIVER = undefined; // fallback to deploymentsJson.zap.dao
const INITIAL_OWNER = undefined; // fallback to deployer.address

async function deploySpoilsManagerFactory(chainId: number) {
  const { contract: spoilsManagerImplementation } =
    await deployContract('SpoilsManager');

  console.log(
    'Spoils Manager Implementation Address:',
    spoilsManagerImplementation.address,
  );

  console.log('Initialized Lock Successful');

  await verifyContract(chainId, spoilsManagerImplementation.address, []);

  const { contract: spoilsManagerFactory } = await deployContract(
    'SpoilsManagerFactory',
    [spoilsManagerImplementation.address],
  );

  console.log('Spoils Manager Factory Address:', spoilsManagerFactory.address);

  await verifyContract(chainId, spoilsManagerFactory.address, [
    spoilsManagerImplementation.address,
  ]);

  const deployment = readDeploymentInfo(network.name);
  const updatedDeployment = updateSpoilsManager(
    deployment,
    spoilsManagerFactory.address,
    spoilsManagerImplementation.address,
  );
  writeDeploymentInfo(updatedDeployment, network.name);

  return {
    factory: spoilsManagerFactory.address,
    implementations: [spoilsManagerImplementation.address],
  };
}

async function deploySpoilsManager(
  {
    spoils,
    receiver,
    newOwner,
  }: { spoils: number; receiver: Hex; newOwner: Hex },
  spoilsManagerData: SpoilsManager,
) {
  if (!spoilsManagerData.factory) {
    console.error('Spoils Manager Factory not found');
    return;
  }

  const spoilsManagerFactory = await viem.getContractAt(
    'SpoilsManagerFactory',
    spoilsManagerData.factory,
  );

  const createSpoilsManagerTxHash =
    await spoilsManagerFactory.write.createSpoilsManager([
      spoils,
      PERCENTAGE_SCALE,
      receiver,
      newOwner,
      toHex(
        toBytes(Math.floor(new Date().getTime() / 1000).toString(), {
          size: 32,
        }),
      ),
    ]);

  const spoilsManagerReceipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({ hash: createSpoilsManagerTxHash });

  if (spoilsManagerReceipt.logs.length === 0) {
    console.log(
      'Spoils Manager Creation Failed, Check Saved Factory/Implementation Address',
    );
  }

  const newSpoilsManager = spoilsManagerReceipt.logs[0].address;
  console.log('New Spoils Manager:', newSpoilsManager);

  const deploymentInfo = readDeploymentInfo(network.name);
  const updateData = addSpoilsManagerInstance(deploymentInfo, newSpoilsManager);
  writeDeploymentInfo(updateData, network.name);
}

async function main(): Promise<void> {
  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const deployer = walletClients[0];
  const { address } = deployer.account;
  const chainId = await publicClient.getChainId();

  let spoilsManagerData = getSpoilsManagerData(chainId);
  const zapData = getZapData(chainId);

  if (
    !spoilsManagerData ||
    spoilsManagerData.factory === '0x' ||
    (spoilsManagerData.implementations &&
      spoilsManagerData.implementations.length === 0)
  ) {
    console.log('Deploying spoils manager factory');
    spoilsManagerData = await deploySpoilsManagerFactory(chainId);
  }

  if (!spoilsManagerData || !zapData) return;

  const receiver = (INITIAL_RECEIVER || zapData.dao) as Hex;

  if (!receiver) {
    console.error('Receiver not found');
    return;
  }

  await deploySpoilsManager(
    {
      spoils: INITIAL_SPOILS,
      receiver,
      newOwner: INITIAL_OWNER || address,
    },
    spoilsManagerData,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

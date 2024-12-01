import { network, viem } from 'hardhat';
import { formatEther } from 'viem';

import {
  getNetworkCurrency,
  getNetworkName,
  getWrappedTokenAddress,
} from './constants';
import { writeDeploymentInfo } from './utils/file';
import { deployContract, verifyContract } from './utils/general';

async function main(): Promise<void> {
  const [deployer] = await viem.getWalletClients();
  const { address } = deployer.account;
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();

  console.log(
    'Deploying SmartInvoiceFactory on network:',
    getNetworkName(chainId),
  );
  console.log('Account address:', address);
  console.log(
    'Account balance:',
    formatEther(await publicClient.getBalance({ address })),
    getNetworkCurrency(chainId),
  );

  const { contract: smartInvoiceFactory, receipt } = await deployContract(
    'SmartInvoiceFactory',
    [getWrappedTokenAddress(chainId)],
  );

  if (!receipt) {
    throw new Error('Deployment failed');
  }

  console.log('Factory Address:', smartInvoiceFactory.address);

  const txHash = receipt.transactionHash;
  console.log('Transaction Hash:', txHash);

  // Overwrites any existing info
  const deploymentInfo = {
    network: network.name,
    factory: smartInvoiceFactory.address,
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber.toString(),
    implementations: {},
  };

  writeDeploymentInfo(deploymentInfo, network.name);

  console.log('Deployed SmartInvoiceFactory to:', deploymentInfo.factory);

  await verifyContract(chainId, deploymentInfo.factory, [
    getWrappedTokenAddress(chainId),
  ]);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

import { network, viem } from 'hardhat';
import { formatEther, isAddress } from 'viem';

import {
  getFactory,
  getNetworkCurrency,
  getNetworkName,
  getWrappedTokenAddress,
} from './constants';
import { readDeploymentInfo, writeDeploymentInfo } from './utils/file';
import { deployContract, verifyContract } from './utils/general';

async function main(): Promise<void> {
  const [deployer] = await viem.getWalletClients();
  const { address } = deployer.account;
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();

  console.log(
    'Deploying SmartInvoiceFactoryBundler on network:',
    getNetworkName(chainId),
  );
  console.log('Account address:', address);
  console.log(
    'Account balance:',
    formatEther(await publicClient.getBalance({ address })),
    getNetworkCurrency(chainId),
  );

  if (!isAddress(getFactory(chainId))) {
    throw new Error('Factory address not found in constants');
  }

  if (!isAddress(getWrappedTokenAddress(chainId))) {
    throw new Error('Wrapped token address not found in constants');
  }

  const { contract: smartInvoiceFactoryBundler, receipt } =
    await deployContract('SmartInvoiceFactoryBundler', [
      getFactory(chainId),
      getWrappedTokenAddress(chainId),
    ]);

  console.log('FactoryBundler Address:', smartInvoiceFactoryBundler.address);

  const txHash = receipt.transactionHash;
  console.log('Transaction Hash:', txHash);

  const existingDeploymentInfo = readDeploymentInfo(network.name);

  const newDeploymentInfo = {
    ...existingDeploymentInfo,
    bundler: {
      address: smartInvoiceFactoryBundler.address,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
    },
  };

  writeDeploymentInfo(newDeploymentInfo, network.name);

  console.log(
    'Deployed SmartInvoiceFactoryBundler to:',
    smartInvoiceFactoryBundler.address,
  );

  await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({ hash: txHash, confirmations: 5 });

  await verifyContract(chainId, smartInvoiceFactoryBundler.address, [
    getFactory(chainId),
    getWrappedTokenAddress(chainId),
  ]);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

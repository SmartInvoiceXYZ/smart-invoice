import { network, viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types/artifacts';
import { formatEther, Hex, keccak256, toBytes } from 'viem';

import { getFactory, getNetworkCurrency, getNetworkName } from './constants';
import {
  appendImplementation,
  readDeploymentInfo,
  writeDeploymentInfo,
} from './utils/file';
import { deployContract, verifyContract } from './utils/general';
import { InvoiceType } from './utils/types';

type EscrowTypes = {
  [K in InvoiceType]: {
    invoiceType: InvoiceType;
    contractName: keyof ContractTypesMap;
  };
};

const ESCROW_TYPES: EscrowTypes = {
  'escrow-v3': {
    invoiceType: 'escrow-v3',
    contractName: 'SmartInvoiceEscrow',
  },
};

// Select the desired escrow type
const escrowTypeData = ESCROW_TYPES['escrow-v3'];
const escrowType = keccak256(toBytes(escrowTypeData.invoiceType));

async function main(): Promise<void> {
  if (!escrowType) return;

  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  const [deployer] = await viem.getWalletClients();
  const { address } = deployer.account;
  const factoryAddress = getFactory(chainId);
  const factoryInstance = await viem.getContractAt(
    'SmartInvoiceFactory',
    factoryAddress,
  );

  console.log(
    `Adding ${escrowTypeData.invoiceType} Implementation on ${getNetworkName(chainId)} to factory: ${factoryInstance.address}`,
  );
  console.log('Account address:', address);
  console.log(
    'Account balance:',
    formatEther(await publicClient.getBalance({ address })),
    getNetworkCurrency(chainId),
  );

  // Deploy the SmartInvoice implementation contract
  const { contract: smartInvoiceImplementation } = await deployContract(
    escrowTypeData.contractName,
  );

  console.log(
    `Deployed ${escrowTypeData.invoiceType} Implementation Address:`,
    smartInvoiceImplementation.address,
  );

  // Add implementation to factory
  const addImplementationTxHash = await factoryInstance.write.addImplementation(
    [escrowType, smartInvoiceImplementation.address],
  );
  await publicClient.waitForTransactionReceipt({
    hash: addImplementationTxHash,
  });

  const version = await factoryInstance.read.currentVersions([escrowType]);
  const implementationAdded = await factoryInstance.read.implementations([
    escrowType,
    version,
  ]);

  console.log(
    `${escrowTypeData.invoiceType} Implementation Added:`,
    implementationAdded,
    'Version:',
    Number(version),
  );

  const deployment = readDeploymentInfo(network.name);
  const updatedDeployment = appendImplementation(
    deployment,
    escrowTypeData.invoiceType,
    smartInvoiceImplementation.address as Hex,
  );

  writeDeploymentInfo(updatedDeployment, network.name);

  await verifyContract(chainId, smartInvoiceImplementation.address, []);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

/* eslint-disable no-console */
const { ethers, network } = require("hardhat");
const { waitForDeployTx, verifyContract } = require("./utils/general");
const {
  getNetworkCurrency,
  getNetworkName,
  getWrappedTokenAddress,
} = require("./constants");
const { writeDeploymentInfo } = require("./utils/file");

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();

  console.log(
    "Deploying SmartInvoiceFactory on network:",
    getNetworkName([chainId]),
  );
  console.log("Account address:", address);
  console.log(
    "Account balance:",
    ethers.utils.formatEther(await deployer.provider.getBalance(address)),
    getNetworkCurrency(chainId),
  );

  const SmartInvoiceFactory = await ethers.getContractFactory(
    "SmartInvoiceFactory",
  );
  const smartInvoiceFactory = await SmartInvoiceFactory.deploy(
    getWrappedTokenAddress(chainId),
  );
  await smartInvoiceFactory.deployed();
  console.log("Factory Address:", smartInvoiceFactory.address);

  const txHash = smartInvoiceFactory.deployTransaction.hash;
  console.log("Transaction Hash:", txHash);

  const receipt = await deployer.provider.getTransactionReceipt(txHash);

  // overwrites any existing info
  const deploymentInfo = {
    network: network.name,
    factory: smartInvoiceFactory.address,
    txHash: smartInvoiceFactory.deployTransaction.hash,
    blockNumber: receipt.blockNumber.toString(),
    implementations: {},
  };

  writeDeploymentInfo(deploymentInfo, network.name);

  await waitForDeployTx(smartInvoiceFactory, chainId, 5);

  console.log("Deployed SmartInvoiceFactory to:", deploymentInfo.factory);

  await verifyContract(network, deploymentInfo.factory, [
    getWrappedTokenAddress(chainId),
  ]);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

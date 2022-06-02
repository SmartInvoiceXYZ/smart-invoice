/* eslint-disable */
const { ethers, run, network } = require("hardhat");
const fs = require("fs");

const wrappedTokenAddress = {
  1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  4: "0xc778417e063141139fce010982780140aa0cd5ab",
  42: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
  77: "0xc655c6D80ac92d75fBF4F40e95280aEb855B1E87",
  100: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
  31337: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
};

const networkName = {
  1: "Mainnet",
  4: "Rinkeby",
  42: "Kovan",
  77: "Sokol",
  100: "xDai",
  1227: "hardhat",
  31337: "anvil-localhost",
};

const networkCurrency = {
  1: "ETH",
  4: "ETH",
  42: "ETH",
  77: "SPOA",
  100: "xDai",
  1337: "hardhat",
  31337: "anvilEth",
};

const BLOCKSCOUT_CHAIN_IDS = [77, 100];

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();
  console.log(chainId, "chaindId");
  console.log(
    "Deploying SmartInvoiceFactory on network:",
    networkName[chainId],
  );
  console.log("Account address:", address);
  console.log(
    "Account balance:",
    ethers.utils.formatEther(await deployer.provider.getBalance(address)),
    networkCurrency[chainId],
  );

  const SmartInvoice = await ethers.getContractFactory("SmartInvoice");
  const smartInvoice = await SmartInvoice.deploy();
  await smartInvoice.deployed();
  console.log("Implementation Address:", smartInvoice.address);

  const SmartInvoiceFactory = await ethers.getContractFactory(
    "SmartInvoiceFactory",
  );
  const smartInvoiceFactory = await SmartInvoiceFactory.deploy(
    smartInvoice.address,
    wrappedTokenAddress[chainId],
  );
  await smartInvoiceFactory.deployed();
  console.log("Factory Address:", smartInvoiceFactory.address);

  await smartInvoice.initLock();

  const txHash = smartInvoiceFactory.deployTransaction.hash;
  const receipt = await deployer.provider.getTransactionReceipt(txHash);
  console.log("Block Number:", receipt.blockNumber);

  //   await smartInvoiceFactory.deployTransaction.wait(5);

  const deploymentInfo = {
    network: network.name,
    factory: smartInvoiceFactory.address,
    txHash,
    blockNumber: receipt.blockNumber.toString(),
  };

  fs.writeFileSync(
    `deployments/${network.name}.json`,
    JSON.stringify(deploymentInfo, undefined, 2),
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

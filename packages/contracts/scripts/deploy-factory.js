/* eslint-disable */
const { ethers, run, network } = require("hardhat");
const fs = require("fs");

const wrappedTokenAddress = {
  4: "0xc778417e063141139fce010982780140aa0cd5ab",
  42: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
  77: "0xc655c6D80ac92d75fBF4F40e95280aEb855B1E87",
  100: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
};

const networkName = {
  4: "Rinkeby",
  42: "Kovan",
  77: "Sokol",
  100: "xDai",
};

const networkCurrency = {
  4: "ETH",
  42: "ETH",
  77: "SPOA",
  100: "xDai",
};

const BLOCKSCOUT_CHAIN_IDS = [77, 100];

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();
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

  await smartInvoiceFactory.deployTransaction.wait(5);

  const TASK_VERIFY = BLOCKSCOUT_CHAIN_IDS.includes(chainId)
    ? "verify:verify-blockscout"
    : "verify:verify";

  await run(TASK_VERIFY, {
    address: smartInvoice.address,
    constructorArguments: [],
  });
  console.log("Verified Implementation");

  await run(TASK_VERIFY, {
    address: smartInvoiceFactory.address,
    constructorArguments: [smartInvoice.address, wrappedTokenAddress[chainId]],
  });
  console.log("Verified Factory");

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

/* eslint-disable */
const { ethers, run, network } = require("hardhat");
const fs = require("fs");

const wrappedTokenAddress = {
  1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  4: "0xc778417e063141139fce010982780140aa0cd5ab",
  5: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  42: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
  77: "0xc655c6D80ac92d75fBF4F40e95280aEb855B1E87",
  100: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
  137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  31337: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
  80001: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
};

const networkName = {
  1: "mainnet",
  4: "rinkeby",
  5: "goerli",
  42: "kovan",
  77: "sokol",
  100: "xdai",
  137: "polygon",
  31337: "localhost",
  80001: "mumbai",
};

const networkCurrency = {
  1: "ETH",
  4: "ETH",
  5: "ETH",
  42: "ETH",
  77: "SPOA",
  100: "xDai",
  137: "MATIC",
  31337: "hhETH",
  80001: "MATIC",
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

  const SmartInvoiceFactory = await ethers.getContractFactory(
    "SmartInvoiceFactory",
  );
  const smartInvoiceFactory = await SmartInvoiceFactory.deploy(
    wrappedTokenAddress[chainId],
  );
  await smartInvoiceFactory.deployed();
  console.log("Factory Address:", smartInvoiceFactory.address);

  const txHash = smartInvoiceFactory.deployTransaction.hash;

  console.log("Transaction Hash:", txHash);

  const receipt = await deployer.provider.getTransactionReceipt(txHash);
  console.log("Block Number:", receipt.blockNumber);

  const deploymentInfo = {
    network: network.name,
    factory: smartInvoiceFactory.address,
    txHash,
    blockNumber: receipt.blockNumber.toString(),
    implementations: {},
  };

  fs.writeFileSync(
    `deployments/${network.name}.json`,
    JSON.stringify(deploymentInfo, undefined, 2),
  );

  if (chainId !== 31337) {
    await smartInvoiceFactory.deployTransaction.wait(5);
    ``;
    const TASK_VERIFY = BLOCKSCOUT_CHAIN_IDS.includes(chainId)
      ? "verify:verify-blockscout"
      : "verify:verify";

    const address = smartInvoiceFactory.address;
    console.log("Deployed SmartInvoiceFactory to:", address);
    console.log("Wrapped token address:", wrappedTokenAddress[chainId]);
    await run(TASK_VERIFY, {
      address,
      constructorArguments: [wrappedTokenAddress[chainId]],
    });
    console.log("Verified Factory");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

/* eslint-disable */
const { ethers } = require("hardhat");

const wrappedTokenAddress = {
  42: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
  4: "0xc778417e063141139fce010982780140aa0cd5ab",
  100: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
};

const networkName = {
  42: "Kovan",
  4: "Rinkeby",
  100: "xDai",
};

const networkCurrency = {
  42: "ETH",
  4: "ETH",
  100: "xDai",
};

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

  const SmartInvoice = await ethers.getContractFactory("SmartInvoiceFactory");
  const smartInvoiceFactory = await SmartInvoice.deploy(
    wrappedTokenAddress[chainId],
  );

  await smartInvoiceFactory.deployed();

  const txHash = smartInvoiceFactory.deployTransaction.hash;
  const receipt = await deployer.provider.getTransactionReceipt(txHash);
  console.log("Transaction Hash:", txHash);
  console.log("Contract Address:", smartInvoiceFactory.address);
  console.log("Block Number:", receipt.blockNumber);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

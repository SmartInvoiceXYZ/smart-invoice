/* eslint-disable */
const { ethers } = require("@nomiclabs/buidler");

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  console.log("Deploying SmartInvoiceFactory with the account:", address);

  if (deployer.provider) {
    console.log(
      "Account balance:",
      ethers.utils.formatEther(await deployer.provider.getBalance(address)),
      "ETH",
    );
  }

  // We get the contract to deploy
  const SmartInvoice = await ethers.getContractFactory("SmartInvoiceFactory");
  const smartInvoiceFactory = await SmartInvoice.deploy();

  await smartInvoiceFactory.deployed();

  console.log("SmartInvoiceFactory deployed to:", smartInvoiceFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

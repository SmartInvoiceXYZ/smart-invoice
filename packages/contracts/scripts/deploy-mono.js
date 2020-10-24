const {ethers} = require("@nomiclabs/buidler");

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  console.log("Deploying SmartInvoiceMono with the account:", address);

  if (deployer.provider) {
    console.log(
      "Account balance:",
      ethers.utils.formatEther(await deployer.provider.getBalance(address)),
      "ETH",
    );
  }

  // We get the contract to deploy
  const SmartInvoice = await ethers.getContractFactory("SmartInvoiceMono");
  const smartInvoiceMono = await SmartInvoice.deploy();

  await smartInvoiceMono.deployed();

  console.log("SmartInvoiceMono deployed to:", smartInvoiceMono.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

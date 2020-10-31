const {ethers} = require("@nomiclabs/buidler");

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  console.log("Deploying SmartEscrowFactory with the account:", address);

  if (deployer.provider) {
    console.log(
      "Account balance:",
      ethers.utils.formatEther(await deployer.provider.getBalance(address)),
      "ETH",
    );
  }

  // We get the contract to deploy
  const SmartEscrow = await ethers.getContractFactory("SmartEscrowFactory");
  const smartEscrowFactory = await SmartEscrow.deploy();

  await smartEscrowFactory.deployed();

  console.log("SmartEscrowFactory deployed to:", smartEscrowFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from "@nomiclabs/buidler";

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  console.log("Deploying SmartEscrowMono with the account:", address);

  if (deployer.provider) {
    console.log(
      "Account balance:",
      ethers.utils.formatEther(await deployer.provider.getBalance(address)),
      "ETH",
    );
  }

  // We get the contract to deploy
  const SmartEscrow = await ethers.getContractFactory("SmartEscrowMono");
  const smartEscrowMono = await SmartEscrow.deploy();

  await smartEscrowMono.deployed();

  console.log("SmartEscrowMono deployed to:", smartEscrowMono.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

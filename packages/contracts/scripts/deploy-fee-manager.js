// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  const FeeManager = await hre.ethers.getContractFactory("FeeManager");

  const newVersion = 1;

  const feeManager = await FeeManager.deploy(newVersion);

  await feeManager.deployed();

  const version = await feeManager.version();

  console.log("FeeManager version:", version);

  console.log("FeeManager deployed to:", feeManager.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

const hre = require("hardhat");

async function main() {
  const FeeManager = await hre.ethers.getContractFactory("FeeManager");
  const { provider } = hre.ethers;

  const chainId = await provider.getNetwork().then(network => network.chainId);

  const newVersion = 1;

  const feeManager = await FeeManager.deploy(newVersion);

  await feeManager.deployed();

  const version = await feeManager.version();

  if (chainId === 31337) {
    await feeManager.setFeePercentage(6);
    console.log("fee percentage set to 6%");
  }

  console.log("FeeManager deployed to:", feeManager.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

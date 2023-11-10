/* eslint-disable no-console */
const { ethers } = require("hardhat");

const spoilsManagerAbi = require("../build/contracts/SpoilsManager.sol/SpoilsManager.json")
  .abi;

const SPOILS_MANAGER_ADDRESS = "0x3fA4E6e03Fbd434A577387924aF39efd3b4b50F2";

async function checkSpoilsManagerData(address, deployer) {
  const spoilsManagerInstance = new ethers.Contract(
    address,
    spoilsManagerAbi,
    deployer,
  );
  const promises = [
    spoilsManagerInstance.owner(),
    spoilsManagerInstance.getSpoils(),
    spoilsManagerInstance.getReceiver(),
  ];

  const [owner, spoils, receiver] = await Promise.all(promises);
  console.log("owner:", owner, ", spoils: ", spoils, ", receiver: ", receiver);
}

async function main() {
  const [deployer] = await ethers.getSigners();

  await checkSpoilsManagerData(SPOILS_MANAGER_ADDRESS, deployer);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

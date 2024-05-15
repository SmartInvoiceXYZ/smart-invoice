/* eslint-disable no-console */
const { ethers, network } = require("hardhat");
const { getSpoilsManagerData, getZapData } = require("./constants");
const {
  readDeploymentInfo,
  writeDeploymentInfo,
  updateSpoilsManager,
  addSpoilsManagerInstance,
} = require("./utils/file");
const { verifyContract } = require("./utils/general");
const {
  abi: spoilsManagerFactoryAbi,
} = require("../build/contracts/SpoilsManager.sol/SpoilsManagerFactory.json");

const INITIAL_SPOILS = 10; // out of 100 multiplied by scale used in SplitMain
const PERCENTAGE_SCALE = 1e4; // percentage scale from SplitMain
const INITIAL_RECEIVER = undefined; // fallback to deploymentsJson.zap.dao
const INITIAL_OWNER = undefined; // fallback to deployer.address

async function deploySpoilsManagerFactory(chainId) {
  const SpoilsManagerImplementation =
    await ethers.getContractFactory("SpoilsManager");
  const spoilsManagerImplementation =
    await SpoilsManagerImplementation.deploy();
  await spoilsManagerImplementation.deployed();
  console.log(
    "Spoils Manager Implementation Address:",
    spoilsManagerImplementation.address,
  );
  await spoilsManagerImplementation.initLock();
  console.log("Initialized Lock Successful");

  verifyContract(
    chainId,
    spoilsManagerImplementation.address,
    [],
    spoilsManagerImplementation,
  );

  const SpoilsManagerFactory = await ethers.getContractFactory(
    "SpoilsManagerFactory",
  );
  const spoilsManagerFactory = await SpoilsManagerFactory.deploy(
    spoilsManagerImplementation.address,
  );
  await spoilsManagerFactory.deployed();
  console.log("Spoils Manager Factory Address:", spoilsManagerFactory.address);

  verifyContract(
    chainId,
    spoilsManagerFactory.address,
    [spoilsManagerImplementation.address],
    spoilsManagerFactory,
  );

  const deployment = readDeploymentInfo(network.name);
  const updatedDeployment = updateSpoilsManager(
    deployment,
    spoilsManagerFactory.address,
    spoilsManagerImplementation.address,
  );
  writeDeploymentInfo(updatedDeployment, network.name);

  return {
    factory: spoilsManagerFactory.address,
    implementations: [spoilsManagerImplementation.address],
  };
}

async function deploySpoilsManager(
  { spoils, receiver, newOwner },
  spoilsManagerData,
  deployer,
) {
  const spoilsManagerFactory = new ethers.Contract(
    spoilsManagerData.factory,
    spoilsManagerFactoryAbi,
    deployer,
  );

  const spoilsManagerReceipt = await spoilsManagerFactory.createSpoilsManager(
    spoils,
    PERCENTAGE_SCALE,
    receiver,
    newOwner,
    ethers.utils.formatBytes32String(
      String(Math.floor(new Date().getTime() / 1000)),
    ),
  );
  const spoilsManager = await spoilsManagerReceipt.wait();

  if (spoilsManager.logs.length === 0) {
    console.log(
      "Spoils Manager Creation Failed, Check Saved Factory/Implementation Address",
    );
    return undefined;
  }
  const newSpoilsManager = spoilsManager.logs[0].address;
  console.log("New Spoils Manager: ", spoilsManager.logs[0].address);

  const deploymentInfo = readDeploymentInfo(network.name);
  const updateData = addSpoilsManagerInstance(deploymentInfo, newSpoilsManager);
  writeDeploymentInfo(updateData, network.name);

  return newSpoilsManager;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();

  // check deployments file for necessary deployments
  let spoilsManagerData = getSpoilsManagerData(chainId);
  const zapData = getZapData(chainId);

  if (
    spoilsManagerData &&
    (spoilsManagerData.factory === "0x" ||
      (spoilsManagerData.implementations &&
        spoilsManagerData.implementations.length === 0))
  ) {
    console.log("deploying spoils manager factory");
    spoilsManagerData = await deploySpoilsManagerFactory(chainId);
  }

  if (!spoilsManagerData || !zapData) return;

  await deploySpoilsManager(
    {
      spoils: INITIAL_SPOILS,
      receiver: INITIAL_RECEIVER || zapData.dao,
      newOwner: INITIAL_OWNER || address,
    },
    spoilsManagerData,
    deployer,
    chainId,
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

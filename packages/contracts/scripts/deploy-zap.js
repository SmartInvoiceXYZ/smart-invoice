/* eslint-disable no-console */
const { ethers, network } = require("hardhat");
const {
  getZapData,
  getFactory,
  getWrappedTokenAddress,
} = require("./constants");
const { verifyContract, waitForDeployTx } = require("./utils/general");
const {
  addZapFactory,
  addZapImplementation,
  readDeploymentInfo,
  writeDeploymentInfo,
  addZapInstance,
} = require("./utils/file");

const DAO_ZAP = true;

async function main() {
  const [deployer] = await ethers.getSigners();
  // const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();
  let zapFactoryInstance;

  // todo handle other networks
  if (chainId !== 5 && chainId !== 31337 && chainId !== 100) return;
  const zapData = getZapData(chainId);
  const deploymentInfo = readDeploymentInfo(network.name);
  let updateFactory = deploymentInfo;

  if (!zapData.factory || zapData.factory === "") {
    const SafeSplitsEscrowZap = await ethers.getContractFactory(
      DAO_ZAP ? "SafeSplitsDaoEscrowZap" : "SafeSplitsEscrowZap",
    );

    const safeSplitsEscrowZapImpl = await SafeSplitsEscrowZap.deploy();
    await safeSplitsEscrowZapImpl.deployed();
    console.log("Implementation Address:", safeSplitsEscrowZapImpl.address);

    waitForDeployTx(safeSplitsEscrowZapImpl, chainId);

    await verifyContract(chainId, safeSplitsEscrowZapImpl.address, []);
    const updateImplementation = addZapImplementation(
      deploymentInfo,
      safeSplitsEscrowZapImpl.address,
    );

    const zapFactory = await ethers.getContractFactory(
      "SafeSplitsEscrowZapFactory",
    );
    zapFactoryInstance = await zapFactory.deploy(
      safeSplitsEscrowZapImpl.address,
    );
    await zapFactoryInstance.deployed();
    console.log(
      "Safe-Splits-Escrow Zap Factory Address:",
      zapFactoryInstance.address,
    );

    waitForDeployTx(zapFactoryInstance, chainId);

    await verifyContract(chainId, zapFactoryInstance.address, [
      safeSplitsEscrowZapImpl.address,
    ]);

    updateFactory = addZapFactory(
      updateImplementation,
      zapFactoryInstance.address,
    );
  }

  if (!zapFactoryInstance) {
    const zapFactory = await ethers.getContractFactory(
      "SafeSplitsEscrowZapFactory",
    );
    zapFactoryInstance = zapFactory.attach(zapData.factory);
  }

  // regular zap = 6 params, dao zap = 8 params
  // deploy a new zap instance
  const zapDeployData = [
    zapData.safeSingleton, //               singleton
    zapData.fallbackHandler, //             fallback handler
    zapData.safeFactory, //                 safe factory
    zapData.splitMain, //                   split main
    zapData.spoilsManager, //               spoils manager
    getFactory(chainId), //                 escrow factory
    getWrappedTokenAddress(chainId), //     wrapped token
    zapData.dao, //                         dao
  ];
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    Array.from({ length: zapDeployData.length }, () => "address"),
    zapDeployData,
  );
  const saltNonce = ethers.utils.formatBytes32String(
    String(Math.floor(new Date().getTime() / 1000)),
  );

  const zapInstanceReceipt = await zapFactoryInstance.createSafeSplitsEscrowZap(
    encodedData,
    saltNonce,
  );
  const safeSplitsEscrowZap = await zapInstanceReceipt.wait();
  console.log(
    "Safe-Splits-Escrow Zap Instance Address:",
    safeSplitsEscrowZap.logs[0].address,
  );

  const updateInstance = addZapInstance(
    updateFactory,
    safeSplitsEscrowZap.logs[0].address,
  );
  writeDeploymentInfo(updateInstance, network.name);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

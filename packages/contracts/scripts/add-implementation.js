/* eslint-disable no-console */
const { ethers, network } = require("hardhat");
const {
  getNetworkName,
  getNetworkCurrency,
  getFactory,
} = require("./constants");
const {
  readDeploymentInfo,
  writeDeploymentInfo,
  appendImplementation,
} = require("./utils/file");
const { verifyContract } = require("./utils/general");
const {
  abi: factoryAbi,
} = require("../build/contracts/SmartInvoiceFactory.sol/SmartInvoiceFactory.json");

const ESCROW_TYPES = {
  escrow: {
    key: "escrow",
    contract: "SmartInvoiceEscrow",
  },
  instant: {
    key: "instant",
    contract: "SmartInvoiceInstant",
  },
  split: {
    key: "split-escrow",
    contract: "SmartInvoiceSplitEscrow",
  },
  updatable: {
    key: "updatable",
    contract: "SmartInvoiceUpdatable",
  },
};

// TODO separate if need CI/CD runs, no easy parameter strategy afaik
const escrowTypeData = ESCROW_TYPES.updatable;
const escrowType = formatBytes32String(escrowTypeData.key);

async function main() {
  if (!escrowType) return;
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();
  const factory = new ethers.Contract(
    getFactory(chainId),
    factoryAbi,
    deployer,
  );

  console.log(
    `Adding ${escrowTypeData.key} Implementation on`,
    getNetworkName(chainId),
    "to factory:",
    factory.address,
  );
  console.log("Account address:", address);
  console.log(
    "Account balance:",
    formatEther(await deployer.provider.getBalance(address)),
    getNetworkCurrency(chainId),
  );

  const SmartInvoiceImplementation = await ethers.getContractFactory(
    escrowTypeData.contract,
  );
  const smartInvoiceImplementation = await SmartInvoiceImplementation.deploy();
  await smartInvoiceImplementation.deployed();

  console.log(
    `Deployed ${escrowTypeData.key} Implementation Address:`,
    smartInvoiceImplementation.address,
  );

  const initLockReceipt = await smartInvoiceImplementation.initLock();
  await initLockReceipt.wait(5);

  console.log("Initialized Lock Successful");

  // ! could not replace existing tx here
  const implementationReceipt = await factory
    .connect(deployer)
    .addImplementation(escrowType, smartInvoiceImplementation.address);

  await implementationReceipt.wait(5);

  const version = await factory.currentVersions(escrowType);

  const implementationAdded = await factory.implementations(
    escrowType,
    version,
  );

  console.log(
    `${escrowTypeData.key} Implementation Added:`,
    implementationAdded,
    "Version:",
    version.toNumber(),
  );

  const deployment = readDeploymentInfo(network.name);

  const updatedDeployment = appendImplementation(
    deployment,
    escrowTypeData.key,
    smartInvoiceImplementation.address,
  );

  writeDeploymentInfo(updatedDeployment, network.name);

  verifyContract(network, smartInvoiceImplementation.address, []);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

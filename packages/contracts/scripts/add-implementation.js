/* eslint-disable no-console */
const { ethers, run, network } = require("hardhat");
const {
  getNetworkName,
  getNetworkCurrency,
  getFactory,
  getUseBlockscout,
} = require("./constants");
const {
  readDeploymentInfo,
  writeDeploymentInfo,
  appendImplementation,
} = require("./utils");
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
};

// TODO separate if need CI/CD runs, no easy parameter strategy
const escrowTypeData = ESCROW_TYPES.escrow;
const escrowType = ethers.utils.formatBytes32String(escrowTypeData.key);

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
    ethers.utils.formatEther(await deployer.provider.getBalance(address)),
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

  await smartInvoiceImplementation.initLock();

  console.log("Initialized Lock Successful");

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

  const deployment = readDeploymentInfo(network);

  const updatedDeployment = appendImplementation(
    deployment,
    escrowTypeData.key,
    smartInvoiceImplementation.address,
  );

  writeDeploymentInfo(updatedDeployment, network);

  if (chainId === 31337) return;
  const TASK_VERIFY = getUseBlockscout(chainId)
    ? "verify:verify-blockscout"
    : "verify:verify";

  console.log("Implementations Address:", address);

  const verifyResult = await run(TASK_VERIFY, {
    address: smartInvoiceImplementation.address,
    constructorArguments: [],
  });

  if (verifyResult) {
    console.log("Contract verified: ", verifyResult);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

/* eslint-disable */
const { ethers, run, network } = require("hardhat");
const fs = require("fs");
const goerli = require("../deployments/goerli.json");
const localhost = require("../deployments/localhost.json");
const xdai = require("../deployments/xdai.json");
const polygon = require("../deployments/polygon.json");
const mumbai = require("../deployments/polygonMumbai.json");
const mainnet = require("../deployments/mainnet.json");
const abi =
  require("../build/contracts/SmartInvoiceFactory.sol/SmartInvoiceFactory.json").abi;

const networkName = {
  1: "mainnet",
  4: "rinkeby",
  5: "goerli",
  42: "kovan",
  77: "sokol",
  100: "xdai",
  137: "polygon",
  31337: "goerli",
  80001: "mumbai",
};

const networkCurrency = {
  1: "ETH",
  4: "ETH",
  5: "ETH",
  42: "ETH",
  77: "SPOA",
  100: "xDai",
  137: "MATIC",
  31337: "localhost",
  80001: "MATIC",
};

const BLOCKSCOUT_CHAIN_IDS = [77, 100];

const escrowType = ethers.utils.formatBytes32String("escrow");

async function main() {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x2559fF0F61870134a1d75cE3F271878DCDb0eEE1"],
  });

  const deployer = await ethers.getSigner(
    "0x2559fF0F61870134a1d75cE3F271878DCDb0eEE1",
  );
  const address = deployer.address;

  const { chainId } = await deployer.provider.getNetwork();

  let selectedNetwork;
  if (networkName[chainId] === "localhost") {
    selectedNetwork = "goerli";
  } else {
    selectedNetwork = networkName[chainId];
  }
  const factories = { goerli, localhost, xdai, polygon, mumbai, mainnet };

  const factory = new ethers.Contract(
    factories[selectedNetwork].factory,
    abi,
    deployer,
  );

  console.log(
    "Adding Implementation on",
    networkName[chainId],
    "to factory:",
    factory.address,
  );

  console.log(
    "Account balance:",
    ethers.utils.formatEther(await deployer.provider.getBalance(address)),
    networkCurrency[chainId],
  );

  const SmartInvoiceFeeEscrow = await ethers.getContractFactory(
    "SmartInvoiceFeeEscrow",
  );
  const smartInvoiceFeeEscrow = await SmartInvoiceFeeEscrow.deploy();
  await smartInvoiceFeeEscrow.deployed();

  console.log(
    "Deployed Implementation Address:",
    smartInvoiceFeeEscrow.address,
  );

  await smartInvoiceFeeEscrow.initLock();

  console.log("Initialized Lock Successful");

  const implementationReceipt = await factory
    .connect(deployer)
    .addImplementation(escrowType, smartInvoiceFeeEscrow.address);

  if (chainId !== 31337) {
    await implementationReceipt.wait(5);
  }

  const version = await factory.currentVersions(escrowType);

  const implementationAdded = await factory.implementations(
    escrowType,
    version,
  );

  console.log(
    "Implementation Added:",
    implementationAdded,
    "Version:",
    version.toNumber(),
  );

  const data = fs.readFileSync(`deployments/${network.name}.json`, {
    encoding: "utf8",
  });

  const deployment = JSON.parse(data);

  if (deployment.implementations.feeEscrow != undefined) {
    deployment.implementations.feeEscrow.push(smartInvoiceFeeEscrow.address);
  } else {
    deployment.implementations["feeEscrow"] = [smartInvoiceFeeEscrow.address];
  }

  fs.writeFileSync(
    `deployments/${network.name}.json`,
    JSON.stringify(deployment, undefined, 2),
  );

  if (chainId !== 31337) {
    const TASK_VERIFY = BLOCKSCOUT_CHAIN_IDS.includes(chainId)
      ? "verify:verify-blockscout"
      : "verify:verify";

    const address = smartInvoiceEscrow.address;

    console.log("Implementations Address:", address);

    const verifyResult = await run(TASK_VERIFY, {
      address: address,
      constructorArguments: [],
    });

    if (verifyResult) {
      console.log("Contract verified: ", verifyResult);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

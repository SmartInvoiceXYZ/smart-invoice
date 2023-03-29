/* eslint-disable */
const { ethers, run, network } = require("hardhat");
const fs = require("fs");
const goerli = require("../deployments/goerli.json");
const localhost = require("../deployments/localhost.json");
const xdai = require("../deployments/xdai.json");
const polygon = require("../deployments/polygon.json");
const abi = require("../build/contracts/SmartInvoiceFactory.sol/SmartInvoiceFactory.json")
  .abi;

const networkName = {
  1: "mainnet",
  4: "rinkeby",
  5: "goerli",
  42: "kovan",
  77: "sokol",
  100: "xdai",
  137: "polygon",
  31337: "localhost",
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
};

const BLOCKSCOUT_CHAIN_IDS = [77, 100];

const escrowType = ethers.utils.formatBytes32String("escrow");

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();
  const factories = { goerli, localhost, xdai, polygon };
  const factory = new ethers.Contract(
    factories[networkName[chainId]].factory,
    abi,
    deployer,
  );

  console.log(
    "Adding Implementation on",
    networkName[chainId],
    "to factory:",
    factory.address,
  );
  console.log("Account address:", address);
  console.log(
    "Account balance:",
    ethers.utils.formatEther(await deployer.provider.getBalance(address)),
    networkCurrency[chainId],
  );

  const SmartInvoiceEscrow = await ethers.getContractFactory(
    "SmartInvoiceEscrow",
  );
  const smartInvoiceEscrow = await SmartInvoiceEscrow.deploy();
  await smartInvoiceEscrow.deployed();

  console.log("Deployed Implementation Address:", smartInvoiceEscrow.address);

  await smartInvoiceEscrow.initLock();

  console.log("Initialized Lock Successful");

  const implementationReceipt = await factory
    .connect(deployer)
    .addImplementation(escrowType, smartInvoiceEscrow.address);

  console.log("Implementation Receipt:", implementationReceipt);

  await implementationReceipt.wait();

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

  if (deployment.implementations.escrow != undefined) {
    deployment.implementations.escrow.push(smartInvoiceEscrow.address);
  } else {
    deployment.implementations["escrow"] = [smartInvoiceEscrow.address];
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

    console.log(verifyResult);
    console.log("Verified Implementation");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

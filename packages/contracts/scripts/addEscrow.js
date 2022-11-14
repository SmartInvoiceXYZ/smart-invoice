/* eslint-disable */
const { ethers, run, network } = require("hardhat");
const fs = require("fs");
const goerli = require("../deployments/goerli.json");
const localhost = require("../deployments/localhost.json");
const xdai = require("../deployments/xdai.json");
const abi =
  require("../build/contracts/SmartInvoiceFactory.sol/SmartInvoiceFactory.json").abi;

const wrappedTokenAddress = {
  1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  4: "0xc778417e063141139fce010982780140aa0cd5ab",
  5: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  42: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
  77: "0xc655c6D80ac92d75fBF4F40e95280aEb855B1E87",
  100: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
};

const networkName = {
  1: "mainnet",
  4: "rinkeby",
  5: "goerli",
  42: "kovan",
  77: "sokol",
  100: "xdai",
  31337: "localhost",
};

const networkCurrency = {
  1: "ETH",
  4: "ETH",
  5: "ETH",
  42: "ETH",
  77: "SPOA",
  100: "xDai",
  31337: "localhost",
};

// const hre = require('hardhat');
// const factory = await hre.ethers.getContractAt("SmartInvoiceFactory", "0x546adED0B0179d550e87cf909939a1207Fd26fB7");

const BLOCKSCOUT_CHAIN_IDS = [77, 100];

const escrowType = ethers.utils.formatBytes32String("escrow");

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();
  const factories = { goerli, localhost, xdai };
  const factory = new ethers.Contract(
    factories[networkName[chainId]].factory,
    abi,
    deployer,
  );
  console.log(escrowType);
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

  const SmartInvoice = await ethers.getContractFactory("SmartInvoiceEscrow");
  const smartInvoice = await SmartInvoice.deploy();
  await smartInvoice.deployed();
  console.log("Implementation Address:", smartInvoice.address);

  await smartInvoice.initLock();

  const implementationReceipt = await factory
    .connect(deployer)
    .addImplementation(escrowType, smartInvoice.address);

  await implementationReceipt.wait();

  const version = await factory.currentVersions(escrowType);

  console.log("Implementation Version", version);

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

  if (chainId !== 31337) {
    const TASK_VERIFY = BLOCKSCOUT_CHAIN_IDS.includes(chainId)
      ? "verify:verify-blockscout"
      : "verify:verify";

    const verifyResult = await run(TASK_VERIFY, {
      address: smartInvoice.address,
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

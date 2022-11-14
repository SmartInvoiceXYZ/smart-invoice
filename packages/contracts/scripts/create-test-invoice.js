const { ethers, run, network, waffle } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
const goerli = require("../deployments/goerli.json");
const localhost = require("../deployments/localhost.json");
const xdai = require("../deployments/xdai.json");
const {
  abi,
} = require("../build/contracts/SmartInvoiceFactory.sol/SmartInvoiceFactory.json");

const { currentTimestamp, createEscrow } = require("../test/utils");

const { deployMockContract, provider: waffleProvider } = waffle;
const IERC20 = require("../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");

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
  31337: "fETH",
};

const wrappedTokenAddress = {
  1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  4: "0xc778417e063141139fce010982780140aa0cd5ab",
  5: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  42: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
  77: "0xc655c6D80ac92d75fBF4F40e95280aEb855B1E87",
  100: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
};

const placeholderAddresses = {
  1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  4: "0xc778417e063141139fce010982780140aa0cd5ab",
  5: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  42: "0xd0a1e359811322d97991e03f863a0c30c2cf029c",
  77: "0xc655c6D80ac92d75fBF4F40e95280aEb855B1E87",
  100: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
};

const BLOCKSCOUT_CHAIN_IDS = [77, 100];

// const hre = require('hardhat');
// const factory = hre.ethers.getContractAt("SmartInvoiceFactory", "0x9E4dD1Ae8E70229D219bB7884d29a17C78DaCEe2");

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const resolverType = 0;
const amounts = [10, 10];
const total = amounts.reduce((t, v) => t + v, 0);
const terminationTime =
  parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;
const requireVerification = true;
const escrowType = ethers.utils.formatBytes32String("escrow");

const factories = { goerli, localhost, xdai };

async function main() {
  const [deployer] = await ethers.getSigners();
  const [client] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const { chainId } = await deployer.provider.getNetwork();

  const factory = new ethers.Contract(
    factories[networkName[chainId]].factory,
    abi,
    deployer,
  );

  console.log(`${networkName[chainId]} factory address:`, factory.address);

  const currentTime = await currentTimestamp();

  const data = ethers.utils.AbiCoder.prototype.encode(
    [
      "address",
      "uint8",
      "address",
      "address",
      "uint256",
      "bytes32",
      "address",
      "bool",
      "address",
    ],
    [
      client.address,
      resolverType,
      placeholderAddresses[chainId],
      wrappedTokenAddress[chainId],
      currentTime + 3600, // exact termination date in seconds since epoch
      EMPTY_BYTES32,
      wrappedTokenAddress[chainId],
      requireVerification,
      factory.address,
    ],
  );

  const receipt = await factory.create(
    placeholderAddresses[chainId],
    amounts,
    data,
    escrowType,
  );

  console.log("Invoice txn receipt:", receipt);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

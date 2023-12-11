/* eslint-disable no-console */
const { ethers } = require("hardhat");
const { getZapData } = require("./constants");

async function main() {
  const [deployer] = await ethers.getSigners();
  const { chainId } = await deployer.provider.getNetwork();

  const zapData = getZapData(chainId);
  const safeSplitsEscrowZapAddress = zapData.instances && zapData.instances[0];

  if (!safeSplitsEscrowZapAddress) {
    console.log("No Safe-Splits-Escrow Zap Deployed");
    return;
  }

  const safeSplitsEscrowZap = await ethers.getContractAt(
    "SafeSplitsDaoEscrowZap",
    safeSplitsEscrowZapAddress,
  );

  const addressList = [
    "safeSingleton",
    "fallbackHandler",
    "safeFactory",
    "splitMain",
    "escrowFactory",
    "wrappedNativeToken",
    "spoilsManager",
    "dao",
  ];

  const addressFetch = addressList.map(async type =>
    safeSplitsEscrowZap[type](),
  );

  const addresses = await Promise.all(addressFetch);
  console.log(
    addresses.map((address, index) => `${addressList[index]}: ${address}`),
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

/* eslint-disable no-console */
const { ethers } = require("hardhat");
const { getZapData } = require("./constants");

async function main() {
  const [deployer] = await ethers.getSigners();
  const { chainId } = await deployer.provider.getNetwork();

  // todo handle other networks
  if (chainId !== 5 && chainId !== 31337) return;
  const zapData = getZapData(chainId);
  const safeSplitsEscrowZapAddress = zapData.instances && zapData.instances[0];

  if (!safeSplitsEscrowZapAddress) {
    console.log("No Safe-Splits-Escrow Zap Deployed");
    return;
  }

  const safeSplitsEscrowZap = await ethers.getContractAt(
    "SafeSplitsEscrowZap",
    safeSplitsEscrowZapAddress,
  );

  const addresses = await safeSplitsEscrowZap.getAddresses();
  console.log(addresses);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

/* eslint-disable no-console */
const { ethers } = require("hardhat");

const ESCROW_ADDRESS = "0x293E057Fdff9396f4F6d081Af5D531C1a0Bc6B1B";

async function main() {
  const updatableEscrow = await ethers.getContractAt(
    "SmartInvoiceUpdatable",
    ESCROW_ADDRESS,
  );

  const providerReceiver = await updatableEscrow.providerReceiver();
  console.log(providerReceiver);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

/* eslint-disable no-console */
const { ethers } = require("hardhat");
const { getZapData, getWrappedTokenAddress } = require("./constants");

const ZAP_DATA = {
  owners: [
    "0x68d36DcBDD7Bbf206e27134F28103abE7cf972df",
    "0x9f1A8952a4bdde3eB02f79B537eAFFEB02b3552C",
  ],
  client: "0x68d36DcBDD7Bbf206e27134F28103abE7cf972df",
  resolver: "0x9f1A8952a4bdde3eB02f79B537eAFFEB02b3552C",
  percentAllocations: [50 * 1e4, 50 * 1e4], // raid party split percent allocations // current split main is 100% = 1e6
  milestoneAmounts: [
    // smallest split amount shows in the UI is 3 decimals
    ethers.BigNumber.from(10).mul(ethers.BigNumber.from(10).pow(14)),
    ethers.BigNumber.from(10).mul(ethers.BigNumber.from(10).pow(14)),
  ], // escrow milestone amounts
  threshold: 2, // threshold
  saltNonce: Math.floor(new Date().getTime() / 1000), // salt nonce
  arbitration: 1,
  token: getWrappedTokenAddress(5), // token
  escrowDeadline: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60, // deadline
  details: formatBytes32String("ipfs://"), // details
  fallbackHandler: "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4",
};

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
    "SafeSplitsEscrowZap",
    safeSplitsEscrowZapAddress,
  );

  const encodedSafeData = defaultAbiCoder.encode(
    ["uint256", "uint256"],
    [ZAP_DATA.threshold, ZAP_DATA.saltNonce],
  );
  const encodedEscrowData = defaultAbiCoder.encode(
    [
      "address",
      "uint32",
      "address",
      "address",
      "uint256",
      "uint256",
      "bytes32",
    ],
    [
      ZAP_DATA.client,
      ZAP_DATA.arbitration,
      ZAP_DATA.resolver,
      ZAP_DATA.token,
      ZAP_DATA.escrowDeadline,
      ZAP_DATA.saltNonce,
      ZAP_DATA.details,
    ],
  );

  console.log(
    "Creating safe, split and escrow with",
    ZAP_DATA.owners.length,
    "owners",
  );
  const SafeSplitsEscrowZapCreateReceipt =
    await safeSplitsEscrowZap.createSafeSplitEscrow(
      ZAP_DATA.owners,
      ZAP_DATA.percentAllocations,
      ZAP_DATA.milestoneAmounts,
      encodedSafeData,
      encodedEscrowData,
    );
  const createResult = await SafeSplitsEscrowZapCreateReceipt.wait();

  const [split] = defaultAbiCoder.decode(
    ["address"],
    createResult.events[2].topics[1],
  );
  const [escrow] = defaultAbiCoder.decode(
    ["address"],
    createResult.events[5].topics[2],
  );
  console.log("Transaction Hash:", createResult.transactionHash);
  console.log("Safe:", createResult.events[0].address); // setup called on safe address
  console.log("Split:", split);
  console.log("Escrow:", escrow);

  // no need to wait for this?
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

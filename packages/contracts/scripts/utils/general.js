const { run } = require("hardhat");
// const { getUseBlockscout } = require("../constants");

async function waitForDeployTx(tx, chainId, wait) {
  if (chainId === 31337 || !tx) return;

  await tx.deployTransaction.wait(wait || 5);
}

async function verifyContract(chainId, address, constructorArguments, message) {
  // don't verify on local network
  if (chainId === 31337) return undefined;

  // const TASK_VERIFY = getUseBlockscout(chainId)
  //   ? "verify:verify-blockscout"
  //   : "verify:verify";
  const TASK_VERIFY = "verify:verify";

  const result = await run(TASK_VERIFY, {
    address,
    constructorArguments,
  });

  if (message) {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  return result;
}

module.exports = {
  verifyContract,
  waitForDeployTx,
};

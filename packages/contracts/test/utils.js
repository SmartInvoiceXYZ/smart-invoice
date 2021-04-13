const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");

const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

module.exports.awaitInvoiceAddress = async receipt => {
  if (!receipt || !receipt.logs) return "";
  const abi = new ethers.utils.Interface([
    "event LogNewInvoice(uint256 indexed id, address invoice, uint256[] amounts)",
  ]);
  const eventFragment = abi.events[Object.keys(abi.events)[0]];
  const eventTopic = abi.getEventTopic(eventFragment);
  const event = receipt.logs.find(e => e.topics[0] === eventTopic);
  if (event) {
    const decodedLog = abi.decodeEventLog(
      eventFragment,
      event.data,
      event.topics,
    );
    return decodedLog.invoice;
  }
  return "";
};

module.exports.currentTimestamp = async () => {
  const block = await waffle.provider.getBlock();
  return +block.timestamp;
};

module.exports.getLockedInvoice = async (
  SmartInvoice,
  client,
  provider,
  resolverType,
  resolver,
  mockToken,
  amounts,
  resolutionRate,
  details,
  mockWrappedNativeToken,
  value = 0,
) => {
  const currentTime = await module.exports.currentTimestamp();
  const newInvoice = await SmartInvoice.deploy(
    client.address,
    provider.address,
    resolverType,
    resolver.address,
    mockToken.address,
    amounts,
    currentTime + 1000,
    resolutionRate,
    details,
    mockWrappedNativeToken.address,
  );
  await newInvoice.deployed();
  expect(await newInvoice["locked()"]()).to.equal(false);
  await mockToken.mock.balanceOf.withArgs(newInvoice.address).returns(10);
  const receipt = newInvoice["lock(bytes32)"](EMPTY_BYTES32, { value });
  await expect(receipt)
    .to.emit(newInvoice, "Lock")
    .withArgs(client.address, EMPTY_BYTES32);
  return newInvoice;
};

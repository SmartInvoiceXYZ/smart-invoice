const { ethers, waffle } = require("hardhat");
const { expect } = require("chai");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

awaitInvoiceAddress = async receipt => {
  if (!receipt || !receipt.logs) return "";
  const abi = new ethers.utils.Interface([
    "event LogNewInvoice(uint256 indexed id, address indexed invoice, uint256[] amounts, bytes32 invoiceType, uint256 version)",
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
    return Promise.resolve(decodedLog.invoice);
  }
  return Promise.resolve("");
};

const currentTimestamp = async () => {
  const block = await waffle.provider.getBlock();
  return +block.timestamp;
};

const createEscrow = async (
  factory,
  invoice,
  type,
  client,
  provider,
  resolverType,
  resolver,
  token,
  amounts,
  terminationTime,
  details,
  wrappedNativeToken,
  requireVerification,
) => {
  await factory.addImplementation(type, invoice.address);
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
      client,
      resolverType,
      resolver,
      token,
      terminationTime, // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      requireVerification,
      factory.address,
    ],
  );

  const receipt = await factory.create(provider, amounts, data, type);
  return Promise.resolve(receipt);
};

const getLockedEscrow = async (
  SmartInvoiceEscrow,
  factory,
  invoiceType,
  client,
  provider,
  resolverType,
  resolver,
  mockToken,
  amounts,
  details,
  mockWrappedNativeToken,
  value = 0,
) => {
  const currentTime = await currentTimestamp();
  let newInvoice = await SmartInvoiceEscrow.deploy();
  await newInvoice.deployed();
  const initReceipt = await createEscrow(
    factory,
    newInvoice,
    invoiceType,
    client.address,
    provider.address,
    resolverType,
    resolver.address,
    mockToken.address,
    amounts,
    currentTime + 1000,
    details,
    mockWrappedNativeToken.address,
    false,
  );
  const newInvoiceAddress = await awaitInvoiceAddress(await initReceipt.wait());
  newInvoice = await SmartInvoiceEscrow.attach(newInvoiceAddress);
  expect(await newInvoice["locked()"]()).to.equal(false);
  await mockToken.mock.balanceOf.withArgs(newInvoice.address).returns(10);
  const receipt = newInvoice["lock(bytes32)"](EMPTY_BYTES32, {
    value: value,
  });
  await expect(receipt)
    .to.emit(newInvoice, "Lock")
    .withArgs(client.address, EMPTY_BYTES32);
  return Promise.resolve(newInvoice);
};

const createSplitEscrow = async (
  factory,
  invoice,
  type,
  client,
  provider,
  resolverType,
  resolver,
  token,
  amounts,
  terminationTime,
  details,
  wrappedNativeToken,
  requireVerification,
  dao,
  daoFee,
) => {
  await factory.addImplementation(type, invoice.address);
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
      "address",
      "uint256",
    ],
    [
      client,
      resolverType,
      resolver,
      token,
      terminationTime, // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      requireVerification,
      factory.address,
      dao,
      daoFee,
    ],
  );

  const receipt = await factory.create(provider, amounts, data, type);
  return Promise.resolve(receipt);
};

const createUpdatableEscrow = async (
  factory,
  invoice,
  type,
  client,
  provider,
  resolverType,
  resolver,
  token,
  amounts,
  terminationTime,
  details,
  wrappedNativeToken,
  requireVerification,
  providerReceiver,
) => {
  await factory.addImplementation(type, invoice.address);
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
      "address",
    ],
    [
      client,
      resolverType,
      resolver,
      token,
      terminationTime, // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      requireVerification,
      factory.address,
      providerReceiver,
    ],
  );

  const receipt = await factory.create(provider, amounts, data, type);
  return Promise.resolve(receipt);
};

const getLockedUpdatableEscrow = async (
  SmartInvoiceEscrow,
  factory,
  invoiceType,
  client,
  provider,
  resolverType,
  resolver,
  mockToken,
  amounts,
  details,
  mockWrappedNativeToken,
  providerReceiver,
  value = 0,
) => {
  const currentTime = await currentTimestamp();
  let newInvoice = await SmartInvoiceEscrow.deploy();
  await newInvoice.deployed();
  const initReceipt = await createUpdatableEscrow(
    factory,
    newInvoice,
    invoiceType,
    client.address,
    provider.address,
    resolverType,
    resolver.address,
    mockToken.address,
    amounts,
    currentTime + 1000,
    details,
    mockWrappedNativeToken.address,
    false,
    providerReceiver,
  );
  const newInvoiceAddress = await awaitInvoiceAddress(await initReceipt.wait());
  newInvoice = await SmartInvoiceEscrow.attach(newInvoiceAddress);
  expect(await newInvoice["locked()"]()).to.equal(false);
  await mockToken.mock.balanceOf.withArgs(newInvoice.address).returns(10);
  const receipt = newInvoice["lock(bytes32)"](EMPTY_BYTES32, {
    value: value,
  });
  await expect(receipt)
    .to.emit(newInvoice, "Lock")
    .withArgs(client.address, EMPTY_BYTES32);
  return Promise.resolve(newInvoice);
};

const getLockedSplitEscrow = async (
  SmartInvoiceEscrow,
  factory,
  invoiceType,
  client,
  provider,
  resolverType,
  resolver,
  mockToken,
  amounts,
  details,
  mockWrappedNativeToken,
  dao,
  daoFee,
  value = 0,
) => {
  const currentTime = await currentTimestamp();
  let newInvoice = await SmartInvoiceEscrow.deploy();
  await newInvoice.deployed();
  const initReceipt = await createSplitEscrow(
    factory,
    newInvoice,
    invoiceType,
    client.address,
    provider.address,
    resolverType,
    resolver.address,
    mockToken.address,
    amounts,
    currentTime + 1000,
    details,
    mockWrappedNativeToken.address,
    false,
    dao,
    daoFee,
  );
  const newInvoiceAddress = await awaitInvoiceAddress(await initReceipt.wait());
  newInvoice = await SmartInvoiceEscrow.attach(newInvoiceAddress);
  expect(await newInvoice["locked()"]()).to.equal(false);
  await mockToken.mock.balanceOf.withArgs(newInvoice.address).returns(10);
  const receipt = newInvoice["lock(bytes32)"](EMPTY_BYTES32, {
    value: value,
  });
  await expect(receipt)
    .to.emit(newInvoice, "Lock")
    .withArgs(client.address, EMPTY_BYTES32);
  return Promise.resolve(newInvoice);
};

const createInstantInvoice = async (
  // factory,
  invoice,
  // type,
  client,
  provider,
  token,
  amounts,
  deadline,
  details,
  wrappedNativeToken,
  lateFeeAmount,
  lateFeeTimeInterval,
) => {
  // await factory.addImplementation(type, invoice.address);
  lateFeeAmount = lateFeeAmount ?? 0;
  lateFeeTimeInterval = lateFeeTimeInterval ?? 0;
  const data = ethers.utils.AbiCoder.prototype.encode(
    [
      "address",
      "address",
      "uint256",
      "bytes32",
      "address",
      "uint256",
      "uint256",
    ],
    [
      client,
      token,
      deadline, // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      lateFeeAmount,
      lateFeeTimeInterval,
    ],
  );

  // const receipt = await factory.create(provider, amounts, data, type);
  const receipt = invoice.init(provider, amounts, data);
  return Promise.resolve(receipt);
};

module.exports = {
  awaitInvoiceAddress,
  currentTimestamp,
  createEscrow,
  getLockedEscrow,
  createSplitEscrow,
  getLockedSplitEscrow,
  createInstantInvoice,
  createUpdatableEscrow,
  getLockedUpdatableEscrow,
  ZERO_ADDRESS,
};

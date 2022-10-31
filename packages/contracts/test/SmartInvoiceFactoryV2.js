const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const { deployMockContract } = waffle;
const { awaitInvoiceAddress } = require("./utils");
const IERC20 = require("../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const resolverType = 0;
const amounts = [10, 10];
const total = amounts.reduce((t, v) => t + v, 0);
const terminationTime =
  parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;

const requireVerification = true;

describe("SmartInvoiceFactoryV2", function () {
  let SmartInvoiceV2;
  let smartInvoiceV2;
  let SmartInvoiceEscrowV2;
  let smartInvoiceEscrowV2;
  let SmartInvoicePayNowV2;
  let smartInvoicePayNowV2;
  let SmartInvoiceFactoryV2;
  let invoiceFactoryV2;
  let implementationData;
  let owner;
  let addr1;
  let addr2;
  let token;
  let wrappedNativeToken;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const mockToken = await deployMockContract(owner, IERC20.abi);
    token = mockToken.address;

    implementationData = ethers.utils.AbiCoder.prototype.encode(
      ["address", "uint256", "bytes32", "bool"],
      [token, terminationTime, EMPTY_BYTES32, requireVerification],
    );

    const MockWrappedTokenFactory = await ethers.getContractFactory("MockWETH");
    const mockWrappedNativeToken = await MockWrappedTokenFactory.deploy();

    SmartInvoiceEscrowV2 = await ethers.getContractFactory(
      "SmartInvoiceEscrowV2",
    );
    smartInvoiceEscrowV2 = await SmartInvoiceEscrowV2.deploy();

    SmartInvoicePayNowV2 = await ethers.getContractFactory(
      "SmartInvoicePayNowV2",
    );
    smartInvoicePayNowV2 = await SmartInvoicePayNowV2.deploy();

    wrappedNativeToken = mockWrappedNativeToken.address;

    SmartInvoiceFactoryV2 = await ethers.getContractFactory(
      "SmartInvoiceFactoryV2",
    );

    invoiceFactoryV2 = await SmartInvoiceFactoryV2.deploy(wrappedNativeToken);

    await invoiceFactoryV2.deployed();

    await invoiceFactoryV2.addImplementation(
      0,
      0,
      smartInvoicePayNowV2.address,
    );
    await invoiceFactoryV2.addImplementation(
      1,
      0,
      smartInvoiceEscrowV2.address,
    );
  });

  it("Should deploy with 0 totalInvoiceCount", async function () {
    const invoiceCount = await invoiceFactoryV2.totalInvoiceCount();
    expect(invoiceCount).to.equal(0);
  });

  // it("Should revert deploy if no implementation", async function () {
  //   const receipt = SmartInvoiceFactoryV2.deploy(ADDRESS_ZERO, ADDRESS_ZERO);
  //   await expect(receipt).to.revertedWith("invalid implementation");
  // });

  it("Should revert deploy if zero wrappedNativeToken", async function () {
    const receipt = SmartInvoiceFactoryV2.deploy(ADDRESS_ZERO);
    await expect(receipt).to.revertedWith("invalid wrappedNativeToken");
  });

  let invoiceAddress;
  let client;
  let provider;
  let resolver;

  it("Should deploy a SmartInvoiceEscrowV2", async function () {
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;

    let implementationType = 1;
    let implementationVersion = 0;
    const receipt = await invoiceFactoryV2.create(
      client,
      provider,
      resolverType,
      resolver,
      amounts,
      implementationData,
      implementationType,
      implementationVersion,
    );
    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    await expect(receipt)
      .to.emit(invoiceFactoryV2, "LogNewInvoice")
      .withArgs(0, invoiceAddress, amounts);

    const invoice = await SmartInvoiceEscrowV2.attach(invoiceAddress);

    expect(await invoice.client()).to.equal(client);
    expect((await invoice.functions.provider())[0]).to.equal(provider);
    expect(await invoice.resolverType()).to.equal(resolverType);
    expect(await invoice.resolver()).to.equal(resolver);
    expect(await invoice.token()).to.equal(token);
    amounts.map(async (v, i) => {
      expect(await invoice.amounts(i)).to.equal(v);
    });
    expect(await invoice.terminationTime()).to.equal(terminationTime);
    expect(await invoice.details()).to.equal(EMPTY_BYTES32);
    expect(await invoice.resolutionRate()).to.equal(20);
    expect(await invoice.milestone()).to.equal(0);
    expect(await invoice.total()).to.equal(total);
    expect(await invoice.locked()).to.equal(false);
    expect(await invoice.disputeId()).to.equal(0);
    expect(await invoice.wrappedNativeToken()).to.equal(wrappedNativeToken);

    expect(await invoiceFactoryV2.getInvoiceAddress(1, 0, 0)).to.equal(
      invoiceAddress,
    );
  });

  it("Should predict SmartInvoiceV2 address", async function () {
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;

    const predictedAddress = await invoiceFactoryV2.predictDeterministicAddress(
      1,
      0,
      EMPTY_BYTES32,
    );

    const receipt = await invoiceFactoryV2.createDeterministic(
      client,
      provider,
      resolverType,
      resolver,
      amounts,
      implementationData,
      1,
      0,
      EMPTY_BYTES32,
    );

    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    await expect(receipt)
      .to.emit(invoiceFactoryV2, "LogNewInvoice")
      .withArgs(0, invoiceAddress, amounts);

    expect(invoiceAddress).to.equal(predictedAddress);
    expect(await invoiceFactoryV2.getInvoiceAddress(1, 0, 0)).to.equal(
      invoiceAddress,
    );
  });

  it("Should update resolutionRate", async function () {
    let resolutionRate = await invoiceFactoryV2.resolutionRates(addr2.address);
    expect(resolutionRate).to.equal(0);
    const receipt = await invoiceFactoryV2
      .connect(addr2)
      .updateResolutionRate(10, EMPTY_BYTES32);
    await expect(receipt)
      .to.emit(invoiceFactoryV2, "UpdateResolutionRate")
      .withArgs(addr2.address, 10, EMPTY_BYTES32);

    resolutionRate = await invoiceFactoryV2.resolutionRates(addr2.address);
    expect(resolutionRate).to.equal(10);
  });

  it("Should deploy with new resolutionRate", async function () {
    await invoiceFactoryV2
      .connect(addr2)
      .updateResolutionRate(10, EMPTY_BYTES32);
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;
    const receipt = await invoiceFactoryV2.create(
      client,
      provider,
      resolverType,
      resolver,
      token,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    await expect(receipt)
      .to.emit(invoiceFactoryV2, "LogNewInvoice")
      .withArgs(0, invoiceAddress, amounts);

    const invoice = await SmartInvoiceV2.attach(invoiceAddress);

    expect(await invoice.resolutionRate()).to.equal(10);

    expect(await invoiceFactoryV2.getInvoiceAddress(0)).to.equal(
      invoiceAddress,
    );
  });

  it("Should update invoiceCount", async function () {
    expect(await invoiceFactoryV2.invoiceCount()).to.equal(0);
    let receipt = await invoiceFactoryV2.create(
      client,
      provider,
      resolverType,
      resolver,
      token,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      requireVerification,
    );
    const invoice0 = await awaitInvoiceAddress(await receipt.wait());
    expect(await invoiceFactoryV2.invoiceCount()).to.equal(1);
    receipt = await invoiceFactoryV2.create(
      client,
      provider,
      resolverType,
      resolver,
      token,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      requireVerification,
    );
    const invoice1 = await awaitInvoiceAddress(await receipt.wait());
    expect(await invoiceFactoryV2.invoiceCount()).to.equal(2);

    expect(await invoiceFactoryV2.getInvoiceAddress(0)).to.equal(invoice0);
    expect(await invoiceFactoryV2.getInvoiceAddress(1)).to.equal(invoice1);
  });
});

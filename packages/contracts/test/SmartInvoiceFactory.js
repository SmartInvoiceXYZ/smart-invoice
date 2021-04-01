const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const { deployMockContract } = waffle;
const { awaitInvoiceAddress } = require("./utils");
const IERC20 = require("../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");

const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const resolverType = 0;
const amounts = [10, 10];
const total = amounts.reduce((t, v) => t + v, 0);
const terminationTime =
  parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;

describe("SmartInvoiceFactory", function () {
  let SmartInvoiceFactory;
  let invoiceFactory;
  let owner;
  let addr1;
  let addr2;
  let token;
  let wrappedNativeToken;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    let mockToken = await deployMockContract(owner, IERC20.abi);
    token = mockToken.address;

    MockWrappedTokenFactory = await ethers.getContractFactory(
      "MockWETH",
    );
    let mockWrappedNativeToken = await MockWrappedTokenFactory.deploy();

    wrappedNativeToken = mockWrappedNativeToken.address;

    SmartInvoiceFactory = await ethers.getContractFactory(
      "SmartInvoiceFactory",
    );

    invoiceFactory = await SmartInvoiceFactory.deploy(wrappedNativeToken);
    await invoiceFactory.deployed();
  });

  it("Should deploy with 0 invoiceCount", async function () {
    const invoiceCount = await invoiceFactory.invoiceCount();
    expect(invoiceCount).to.equal(0);
  });

  let invoiceAddress;
  let client;
  let provider;
  let resolver;

  it("Should deploy a SmartInvoice", async function () {
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;
    const receipt = await invoiceFactory.create(
      client,
      provider,
      resolverType,
      resolver,
      token,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
    );
    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    expect(receipt)
      .to.emit(invoiceFactory, "LogNewInvoice")
      .withArgs(0, invoiceAddress, amounts);

    const SmartInvoice = await ethers.getContractFactory("SmartInvoice");
    const invoice = await SmartInvoice.attach(invoiceAddress);

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

    expect(await invoiceFactory.getInvoiceAddress(0)).to.equal(invoiceAddress);
  });

  it("Should update resolutionRate", async function () {
    let resolutionRate = await invoiceFactory.resolutionRates(addr2.address);
    expect(resolutionRate).to.equal(0);
    const receipt = await invoiceFactory
      .connect(addr2)
      .updateResolutionRate(10, EMPTY_BYTES32);
    expect(receipt)
      .to.emit(invoiceFactory, "UpdateResolutionRate")
      .withArgs(addr2.address, 10, EMPTY_BYTES32);

    resolutionRate = await invoiceFactory.resolutionRates(addr2.address);
    expect(resolutionRate).to.equal(10);
  });

  it("Should deploy with new resolutionRate", async function () {
    await invoiceFactory.connect(addr2).updateResolutionRate(10, EMPTY_BYTES32);
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;
    const receipt = await invoiceFactory.create(
      client,
      provider,
      resolverType,
      resolver,
      token,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
    );
    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    expect(receipt)
      .to.emit(invoiceFactory, "LogNewInvoice")
      .withArgs(0, invoiceAddress, amounts);

    const SmartInvoice = await ethers.getContractFactory("SmartInvoice");
    const invoice = await SmartInvoice.attach(invoiceAddress);

    expect(await invoice.resolutionRate()).to.equal(10);

    expect(await invoiceFactory.getInvoiceAddress(0)).to.equal(invoiceAddress);
  });

  it("Should update invoiceCount", async function () {
    expect(await invoiceFactory.invoiceCount()).to.equal(0);
    let receipt = await invoiceFactory.create(
      client,
      provider,
      resolverType,
      resolver,
      token,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
    );
    const invoice0 = await awaitInvoiceAddress(await receipt.wait());
    expect(await invoiceFactory.invoiceCount()).to.equal(1);
    receipt = await invoiceFactory.create(
      client,
      provider,
      resolverType,
      resolver,
      token,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
    );
    const invoice1 = await awaitInvoiceAddress(await receipt.wait());
    expect(await invoiceFactory.invoiceCount()).to.equal(2);

    expect(await invoiceFactory.getInvoiceAddress(0)).to.equal(invoice0);
    expect(await invoiceFactory.getInvoiceAddress(1)).to.equal(invoice1);
  });
});

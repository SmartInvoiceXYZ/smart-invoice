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
const escrowType = formatBytes32String("escrow");

describe("SmartInvoiceFactory", function () {
  let SmartInvoiceEscrow;
  let escrow;
  let SmartInvoiceFactory;
  let invoiceFactory;
  let owner;
  let addr1;
  let addr2;
  let token;
  let wrappedNativeToken;

  let invoiceAddress;
  let client;
  let provider;
  let resolver;

  let data;
  let escrowData;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;

    const mockToken = await deployMockContract(owner, IERC20.abi);
    token = mockToken.address;

    const MockWrappedTokenFactory = await ethers.getContractFactory("MockWETH");
    const mockWrappedNativeToken = await MockWrappedTokenFactory.deploy();

    wrappedNativeToken = mockWrappedNativeToken.address;
    const details = EMPTY_BYTES32;

    SmartInvoiceEscrow = await ethers.getContractFactory("SmartInvoiceEscrow");
    escrow = await SmartInvoiceEscrow.deploy();

    SmartInvoiceFactory = await ethers.getContractFactory(
      "SmartInvoiceFactory",
    );
    invoiceFactory = await SmartInvoiceFactory.deploy(wrappedNativeToken);

    await invoiceFactory.deployed();

    escrowData = [
      client,
      resolverType,
      resolver,
      token,
      terminationTime, // exact termination date in seconds since epoch
      details,
      wrappedNativeToken,
      requireVerification,
      invoiceFactory.address,
    ];
  });

  it("Should deploy with 0 invoiceCount", async function () {
    const invoiceCount = await invoiceFactory.invoiceCount();
    expect(invoiceCount).to.equal(0);
  });

  it("Should revert deploy if zero wrappedNativeToken", async function () {
    const receipt = SmartInvoiceFactory.deploy(ADDRESS_ZERO);
    await expect(receipt).to.revertedWith("invalid wrappedNativeToken");
  });

  it("Should deploy and set DEFAULT_ADMIN and ADMIN roles as msg.sender", async function () {
    const deployer = owner.address;
    const adminRole = await invoiceFactory.hasRole(
      invoiceFactory.ADMIN(),
      deployer,
    );
    const defaultAdminRole = await invoiceFactory.hasRole(
      invoiceFactory.DEFAULT_ADMIN_ROLE(),
      deployer,
    );
    expect(adminRole).to.equal(true);
    expect(defaultAdminRole).to.equal(true);
  });

  it("Should addImplementation as an admin", async function () {
    await expect(
      invoiceFactory
        .connect(owner)
        .addImplementation(escrowType, escrow.address),
    ).not.reverted;
  });

  it("Should addImplementation and emit AddImplementation event", async function () {
    const implementation = escrow.address;
    const version = 0;
    const receipt = await invoiceFactory
      .connect(owner)
      .addImplementation(escrowType, implementation);
    await expect(receipt)
      .to.emit(invoiceFactory, "AddImplementation")
      .withArgs(escrowType, version, implementation);
  });

  it("Implementation getter should return correct implementation", async function () {
    const implementation = escrow.address;
    await invoiceFactory
      .connect(owner)
      .addImplementation(escrowType, implementation);
    expect(await invoiceFactory.getImplementation(escrowType, 0)).to.be.equal(
      implementation,
    );
  });

  it("Should revert addImplementation if non-admin", async function () {
    const blackhat = addr1;
    const implementation = escrow.address;
    const receipt = invoiceFactory
      .connect(blackhat)
      .addImplementation(escrowType, implementation);
    await expect(receipt).to.be.reverted;
  });

  it("Should deploy a SmartInvoiceEscrow", async function () {
    await invoiceFactory
      .connect(owner)
      .addImplementation(escrowType, escrow.address);
    const version = await invoiceFactory.currentVersions(escrowType);
    data = AbiCoder.prototype.encode(
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
      escrowData,
    );
    const receipt = await invoiceFactory.create(
      provider,
      amounts,
      data,
      escrowType,
    );
    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    await expect(receipt)
      .to.emit(invoiceFactory, "LogNewInvoice")
      .withArgs(0, invoiceAddress, amounts, escrowType, version);

    const invoice = await SmartInvoiceEscrow.attach(invoiceAddress);
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

  it("Should revert create if no implementation of _type", async function () {
    const fakeType = formatBytes32String("fake");
    data = AbiCoder.prototype.encode(["string"], [""]);
    const receipt = invoiceFactory.create(provider, amounts, "0x", fakeType);

    await expect(receipt).to.revertedWith("Implementation does not exist");
  });

  it("Should predict SmartInvoice address", async function () {
    await invoiceFactory
      .connect(owner)
      .addImplementation(escrowType, escrow.address);
    const version = await invoiceFactory.currentVersions(escrowType);
    data = AbiCoder.prototype.encode(
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
      escrowData,
    );
    const predictedAddress = await invoiceFactory.predictDeterministicAddress(
      escrowType,
      EMPTY_BYTES32,
    );

    const receipt = await invoiceFactory.createDeterministic(
      provider,
      amounts,
      data,
      escrowType,
      EMPTY_BYTES32,
    );

    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    await expect(receipt)
      .to.emit(invoiceFactory, "LogNewInvoice")
      .withArgs(0, invoiceAddress, amounts, escrowType, version);

    expect(invoiceAddress).to.equal(predictedAddress);
    expect(await invoiceFactory.getInvoiceAddress(0)).to.equal(invoiceAddress);
  });

  it("Should update resolutionRate", async function () {
    let resolutionRate = await invoiceFactory.resolutionRates(addr2.address);
    expect(resolutionRate).to.equal(0);
    const receipt = await invoiceFactory
      .connect(addr2)
      .updateResolutionRate(10, EMPTY_BYTES32);
    await expect(receipt)
      .to.emit(invoiceFactory, "UpdateResolutionRate")
      .withArgs(addr2.address, 10, EMPTY_BYTES32);

    resolutionRate = await invoiceFactory.resolutionRates(addr2.address);
    expect(resolutionRate).to.equal(10);
  });

  it("Should deploy with new resolutionRate", async function () {
    await invoiceFactory
      .connect(owner)
      .addImplementation(escrowType, escrow.address);
    const version = 0;
    data = AbiCoder.prototype.encode(
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
      escrowData,
    );

    await invoiceFactory.connect(addr2).updateResolutionRate(10, EMPTY_BYTES32);
    const receipt = await invoiceFactory.create(
      provider,
      amounts,
      data,
      escrowType,
    );
    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    await expect(receipt)
      .to.emit(invoiceFactory, "LogNewInvoice")
      .withArgs(0, invoiceAddress, amounts, escrowType, version);

    const invoice = await SmartInvoiceEscrow.attach(invoiceAddress);

    expect(await invoice.resolutionRate()).to.equal(10);

    expect(await invoiceFactory.getInvoiceAddress(0)).to.equal(invoiceAddress);
  });

  it("Should update invoiceCount", async function () {
    await invoiceFactory
      .connect(owner)
      .addImplementation(escrowType, escrow.address);
    const version = 0;
    data = AbiCoder.prototype.encode(
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
      escrowData,
    );

    expect(await invoiceFactory.invoiceCount()).to.equal(0);
    let receipt = await invoiceFactory.create(
      provider,
      amounts,
      data,
      escrowType,
    );
    const invoice0 = await awaitInvoiceAddress(await receipt.wait());
    expect(await invoiceFactory.invoiceCount()).to.equal(1);
    receipt = await invoiceFactory.create(provider, amounts, data, escrowType);
    const invoice1 = await awaitInvoiceAddress(await receipt.wait());
    expect(await invoiceFactory.invoiceCount()).to.equal(2);

    expect(await invoiceFactory.getInvoiceAddress(0)).to.equal(invoice0);
    expect(await invoiceFactory.getInvoiceAddress(1)).to.equal(invoice1);
  });
});

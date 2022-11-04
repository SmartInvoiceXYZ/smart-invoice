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
let total = amounts.reduce((t, v) => t + v, 0);
const terminationTime =
  parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;
const requireVerification = true;
const newImplementation = "0x7Ee9AE2a2eAF3F0df8D323d555479be562ac4905";

const escrowType = ethers.utils.formatBytes32String("escrow");
const instantType = ethers.utils.formatBytes32String("instant");
const fakeType = ethers.utils.formatBytes32String("fugazi");

describe("SmartInvoiceFactory", function () {
  let SmartInvoice;
  let smartInvoice;
  let SmartInvoiceEscrow;
  let smartInvoiceEscrow;
  let SmartInvoicePayNow;
  let smartInvoicePayNow;
  let SmartInvoiceFactory;
  let invoiceFactory;
  let implementationData;
  let implementationInfoData;
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

    SmartInvoiceEscrow = await ethers.getContractFactory("SmartInvoiceEscrow");
    smartInvoiceEscrow = await SmartInvoiceEscrow.deploy();

    SmartInvoicePayNow = await ethers.getContractFactory(
      "SmartInvoicePayNowV2",
    );
    smartInvoicePayNow = await SmartInvoicePayNow.deploy();

    wrappedNativeToken = mockWrappedNativeToken.address;

    SmartInvoiceFactory = await ethers.getContractFactory(
      "SmartInvoiceFactory",
    );

    invoiceFactory = await SmartInvoiceFactory.deploy(wrappedNativeToken);

    await invoiceFactory.deployed();

    await invoiceFactory.addImplementation(
      instantType,
      smartInvoicePayNow.address,
    );

    await invoiceFactory.addImplementation(
      escrowType,
      smartInvoiceEscrow.address,
    );

    implementationInfoData = ethers.utils.AbiCoder.prototype.encode(
      ["bytes32", "uint8", "address", "uint256"],
      [
        escrowType,
        0,
        smartInvoiceEscrow.address,
        await invoiceFactory.invoiceCount(),
      ],
    );
  });

  it("Should deploy with 0 totalInvoiceCount", async function () {
    const invoiceCount = await invoiceFactory.invoiceCount();
    expect(invoiceCount).to.equal(0);
  });

  it("Should revert deploy if zero wrappedNativeToken", async function () {
    const receipt = SmartInvoiceFactory.deploy(ADDRESS_ZERO);
    await expect(receipt).to.revertedWith("invalid wrappedNativeToken");
  });

  it("Deploying address should have DEFAULT_ADMIN and ADMIN roles", async function () {
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

  it("Admin can add implementation", async function () {
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

  it("Non-admin cannot add implementation", async function () {
    const blackhat = addr1;
    const receipt = invoiceFactory
      .connect(blackhat)
      .addImplementation(escrowType, newImplementation);
    await expect(receipt).to.be.reverted;
  });

  let invoiceAddress;
  let client;
  let provider;
  let resolver;

  it("Cannot add implementation that already exists", async function () {
    owner = owner.address;
    await invoiceFactory.addImplementation(escrowType, newImplementation);
    const dupe = invoiceFactory.addImplementation(
      escrowType,
      newImplementation,
    );
    await expect(dupe).to.revertedWith("implementation already added");
  });

  it("Should revert deploy if zero wrappedNativeToken", async function () {
    const receipt = SmartInvoiceFactory.deploy(ADDRESS_ZERO);
    await expect(receipt).to.revertedWith("invalid wrappedNativeToken");
  });

  it("Should revert deploy if no implementation", async function () {
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;

    const receipt = invoiceFactory.create(
      client,
      provider,
      resolverType,
      resolver,
      amounts,
      implementationData,
      fakeType,
    );

    await expect(receipt).to.revertedWith(
      "Invoice implementation does not exist",
    );
  });

  it("Should deploy a SmartInvoiceEscrow", async function () {
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;

    const receipt = await invoiceFactory.create(
      client,
      provider,
      resolverType,
      resolver,
      amounts,
      implementationData,
      escrowType,
    );
    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    await expect(receipt)
      .to.emit(invoiceFactory, "LogNewInvoice")
      .withArgs(
        0,
        invoiceAddress,
        amounts,
        escrowType,
        0,
        smartInvoiceEscrow.address,
      );

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

  it("Should predict SmartInvoice address", async function () {
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;

    const predictedAddress = await invoiceFactory.predictDeterministicAddress(
      escrowType,
      EMPTY_BYTES32,
    );

    const receipt = await invoiceFactory.createDeterministic(
      client,
      provider,
      resolverType,
      resolver,
      amounts,
      implementationData,
      escrowType,
      EMPTY_BYTES32,
    );

    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    await expect(receipt)
      .to.emit(invoiceFactory, "LogNewInvoice")
      .withArgs(
        0,
        invoiceAddress,
        amounts,
        escrowType,
        0,
        smartInvoiceEscrow.address,
      );

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
    await invoiceFactory.connect(addr2).updateResolutionRate(10, EMPTY_BYTES32);
    client = owner.address;
    provider = addr1.address;
    resolver = addr2.address;
    const receipt = await invoiceFactory.create(
      client,
      provider,
      resolverType,
      resolver,
      amounts,
      implementationData,
      escrowType,
    );
    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    await expect(receipt)
      .to.emit(invoiceFactory, "LogNewInvoice")
      .withArgs(
        0,
        invoiceAddress,
        amounts,
        escrowType,
        0,
        smartInvoiceEscrow.address,
      );

    const invoice = await SmartInvoiceEscrow.attach(invoiceAddress);

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
      amounts,
      implementationData,
      escrowType,
    );
    const invoice0 = await awaitInvoiceAddress(await receipt.wait());
    expect(await invoiceFactory.invoiceCount()).to.equal(1);
    receipt = await invoiceFactory.create(
      client,
      provider,
      resolverType,
      resolver,
      amounts,
      implementationData,
      escrowType,
    );
    const invoice1 = await awaitInvoiceAddress(await receipt.wait());
    expect(await invoiceFactory.invoiceCount()).to.equal(2);

    expect(await invoiceFactory.getInvoiceAddress(0)).to.equal(invoice0);
    expect(await invoiceFactory.getInvoiceAddress(1)).to.equal(invoice1);
  });
});

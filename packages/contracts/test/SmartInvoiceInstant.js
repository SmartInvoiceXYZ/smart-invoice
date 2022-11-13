const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const { deployMockContract, provider: waffleProvider } = waffle;
const {
  currentTimestamp,
  getLockedInvoice,
  createInstantInvoice,
} = require("./utils");
const IERC20 = require("../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const individualResolverType = 0;
const arbitratorResolverType = 1;
const amounts = [10, 10];
const total = amounts.reduce((t, v) => t + v, 0);
const terminationTime =
  parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;
const resolutionRate = 20;
const requireVerification = true;

describe("SmartInvoiceInstant", function () {
  let SmartInvoiceInstant;
  let invoice;
  let mockToken;
  let otherMockToken;
  let mockWrappedNativeToken;
  let mockArbitrator;
  let client;
  let provider;
  let resolver;
  let randomSigner;

  beforeEach(async function () {
    [client, provider, randomSigner] = await ethers.getSigners();

    mockToken = await deployMockContract(client, IERC20.abi);
    otherMockToken = await deployMockContract(client, IERC20.abi);

    const MockWrappedTokenFactory = await ethers.getContractFactory("MockWETH");
    mockWrappedNativeToken = await MockWrappedTokenFactory.deploy();

    // const MockArbitratorFactory = await ethers.getContractFactory(
    //   "MockArbitrator",
    // );
    // mockArbitrator = await MockArbitratorFactory.deploy(10);

    SmartInvoiceInstant = await ethers.getContractFactory(
      "SmartInvoiceInstant",
    );
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    const data = ethers.utils.AbiCoder.prototype.encode(
      ["address", "address", "uint256", "bytes32", "address"],
      [
        client.address,
        mockToken.address,
        terminationTime, // exact termination date in seconds since epoch
        EMPTY_BYTES32,
        mockWrappedNativeToken.address,
      ],
    );
    await invoice.init(provider.address, amounts, data);
  });

  it("Should deploy a SmartInvoiceInstant", async function () {
    expect(await invoice.client()).to.equal(client.address);
    expect(await invoice["provider()"]()).to.equal(provider.address);
    expect(await invoice.token()).to.equal(mockToken.address);
    amounts.map(async (v, i) => {
      expect(await invoice.amounts(i)).to.equal(v);
    });
    expect(await invoice.deadline()).to.equal(terminationTime);
    expect(await invoice.details()).to.equal(EMPTY_BYTES32);
    expect(await invoice.total()).to.equal(total);
    expect(await invoice.wrappedNativeToken()).to.equal(
      mockWrappedNativeToken.address,
    );
  });

  it("Should revert initLock if already init", async function () {
    const receipt = invoice.initLock();
    await expect(receipt).to.revertedWith(
      "Initializable: contract is already initialized",
    );
  });

  it("Should revert init if initLocked", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    await invoice.initLock();
    const receipt = createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockToken.address,
      amounts,
      currentTime - 3600,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith(
      "Initializable: contract is already initialized",
    );
  });

  it("Should revert init if invalid client", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    const receipt = createInstantInvoice(
      invoice,
      ADDRESS_ZERO,
      provider.address,
      mockToken.address,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("invalid client");
  });

  it("Should revert init if invalid provider", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    const receipt = createInstantInvoice(
      invoice,
      client.address,
      ADDRESS_ZERO,
      mockToken.address,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("invalid provider");
  });

  it("Should revert init if invalid token", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    const receipt = createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      ADDRESS_ZERO,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("invalid token");
  });

  it("Should revert init if invalid wrappedNativeToken", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    const receipt = createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockToken.address,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      ADDRESS_ZERO,
    );
    await expect(receipt).to.revertedWith("invalid wrappedNativeToken");
  });

  it("Should revert init if deadline has ended", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    const receipt = createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockToken.address,
      amounts,
      currentTime - 3600,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("duration ended");
  });

  it("Should revert init if deadline too long", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    const receipt = createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockToken.address,
      amounts,
      currentTime + 5 * 365 * 24 * 3600,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("duration too long");
  });

  it("Should withdraw to provider", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    await createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockToken.address,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(20);
    await mockToken.mock.transfer.withArgs(provider.address, 20).returns(true);

    const receipt = invoice["withdraw()"]();
    await expect(receipt)
      .to.emit(invoice, "Withdraw")
      .withArgs(provider.address, 20);
  });

  xit("Should withdraw and add balance to totalFulfilled");

  xit(
    "Should withdraw and set fulfilled true if totalFulfilled reaches total due",
  );

  it("Should revert withdraw after terminationTime if balance is 0", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    await createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockToken.address,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );

    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(0);

    const receipt = invoice["withdraw()"]();
    await expect(receipt).to.be.revertedWith("balance is 0");
  });

  it("Should call withdraw from withdrawTokens", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    await createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockToken.address,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );

    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(20);
    await mockToken.mock.transfer.withArgs(provider.address, 20).returns(true);

    const receipt = await invoice["withdrawTokens(address)"](mockToken.address);
    await expect(receipt)
      .to.emit(invoice, "Withdraw")
      .withArgs(provider.address, 20);
  });

  it("Should withdrawTokens for otherToken", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    await createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockToken.address,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );

    await otherMockToken.mock.balanceOf.withArgs(invoice.address).returns(20);
    await otherMockToken.mock.transfer
      .withArgs(provider.address, 20)
      .returns(true);

    const receipt = invoice["withdrawTokens(address)"](otherMockToken.address);
    await expect(receipt).to.be.not.reverted;
  });

  it("Should revert withdrawTokens for otherToken if balance is 0", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    await createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockToken.address,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );

    await otherMockToken.mock.balanceOf.withArgs(invoice.address).returns(0);
    const receipt = invoice["withdrawTokens(address)"](otherMockToken.address);
    await expect(receipt).to.be.revertedWith("balance is 0");
  });

  it("Should revert receive if not wrappedNativeToken", async function () {
    const receipt = client.sendTransaction({
      to: invoice.address,
      value: 10,
    });
    await expect(receipt).to.be.revertedWith("!wrappedNativeToken");
  });

  it("Should accept receive and convert to wrapped token", async function () {
    invoice = await SmartInvoiceInstant.deploy();
    await invoice.deployed();
    await createInstantInvoice(
      invoice,
      client.address,
      provider.address,
      mockWrappedNativeToken.address,
      amounts,
      terminationTime,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );

    const receipt = await client.sendTransaction({
      to: invoice.address,
      value: 10,
    });
    await expect(receipt)
      .to.emit(invoice, "Deposit")
      .withArgs(client.address, 10);
    expect(await mockWrappedNativeToken.balanceOf(invoice.address)).to.equal(
      10,
    );
  });
});

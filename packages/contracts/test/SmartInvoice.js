const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const { deployMockContract, provider: waffleProvider } = waffle;
const { currentTimestamp, getLockedInvoice } = require("./utils");
const IERC20 = require("../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");

const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const individualResolverType = 0;
const arbitratorResolverType = 1;
const amounts = [10, 10];
const total = amounts.reduce((t, v) => t + v, 0);
const terminationTime =
  parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;
const resolutionRate = 20;

describe("SmartInvoice", function () {
  let SmartInvoice;
  let invoice;
  let mockToken;
  let otherMockToken;
  let mockWrappedNativeToken;
  let mockArbitrator;
  let client;
  let provider;
  let resolver;

  beforeEach(async function () {
    [client, provider, resolver] = await ethers.getSigners();

    mockToken = await deployMockContract(client, IERC20.abi);
    otherMockToken = await deployMockContract(client, IERC20.abi);

    const MockWrappedTokenFactory = await ethers.getContractFactory("MockWETH");
    mockWrappedNativeToken = await MockWrappedTokenFactory.deploy();

    const MockArbitratorFactory = await ethers.getContractFactory(
      "MockArbitrator",
    );
    mockArbitrator = await MockArbitratorFactory.deploy(10);

    SmartInvoice = await ethers.getContractFactory("SmartInvoice");
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      terminationTime,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
  });

  it("Should deploy a SmartInvoice", async function () {
    expect(await invoice.client()).to.equal(client.address);
    expect(await invoice["provider()"]()).to.equal(provider.address);
    expect(await invoice.resolverType()).to.equal(individualResolverType);
    expect(await invoice.resolver()).to.equal(resolver.address);
    expect(await invoice.token()).to.equal(mockToken.address);
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
    expect(await invoice.wrappedNativeToken()).to.equal(
      mockWrappedNativeToken.address,
    );
  });

  it("Should revert initLock if already init", async function () {
    const receipt = invoice.initLock();
    await expect(receipt).to.revertedWith("Initializable: contract is already initialized");
  });

  it("Should revert init if initLocked", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.initLock();
    const receipt = invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime - 3600,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("Initializable: contract is already initialized");
  });

  it("Should revert init if terminationTime has ended", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    const receipt = invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime - 3600,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("duration ended");
  });

  it("Should revert init if terminationTime too long", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    const receipt = invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 5 * 365 * 24 * 3600,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("duration too long");
  });

  it("Should revert init if resolutionRate is 0", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    const receipt = invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 365 * 24 * 3600,
      0,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("invalid resolutionRate");
  });

  it("Should revert init if resolverType > 1", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    const receipt = invoice.init(
      client.address,
      provider.address,
      2,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 365 * 24 * 3600,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(receipt).to.revertedWith("invalid resolverType");
  });

  it("Should revert release by non client", async function () {
    invoice = await invoice.connect(provider);
    await expect(invoice["release()"]()).to.be.revertedWith("!client");
  });

  it("Should revert release with low balance", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(5);
    await expect(invoice["release()"]()).to.be.revertedWith(
      "insufficient balance",
    );
  });

  it("Should release", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    const receipt = await invoice["release()"]();
    expect(await invoice["released()"]()).to.equal(10);
    expect(await invoice["milestone()"]()).to.equal(1);
    await expect(receipt).to.emit(invoice, "Release").withArgs(0, 10);
  });

  it("Should release full balance at last milestone", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice["release()"]();
    expect(await invoice["released()"]()).to.equal(10);
    expect(await invoice["milestone()"]()).to.equal(1);
    await expect(receipt).to.emit(invoice, "Release").withArgs(0, 10);
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(15);
    await mockToken.mock.transfer.withArgs(provider.address, 15).returns(true);
    receipt = await invoice["release()"]();
    expect(await invoice["released()"]()).to.equal(25);
    expect(await invoice["milestone()"]()).to.equal(2);
    await expect(receipt).to.emit(invoice, "Release").withArgs(1, 15);
  });

  it("Should release full balance after all milestones are completed", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice["release()"]();
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(15);
    await mockToken.mock.transfer.withArgs(provider.address, 15).returns(true);
    receipt = await invoice["release()"]();
    expect(await invoice["released()"]()).to.equal(25);
    expect(await invoice["milestone()"]()).to.equal(2);
    await expect(receipt).to.emit(invoice, "Release").withArgs(1, 15);

    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(20);
    await mockToken.mock.transfer.withArgs(provider.address, 20).returns(true);
    receipt = await invoice["release()"]();
    expect(await invoice["released()"]()).to.equal(45);
    expect(await invoice["milestone()"]()).to.equal(2);
    await expect(receipt).to.emit(invoice, "Release").withArgs(2, 20);
  });

  it("Should revert release if 0 balance after all milestones are completed", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice["release()"]();
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(15);
    await mockToken.mock.transfer.withArgs(provider.address, 15).returns(true);
    receipt = await invoice["release()"]();
    expect(await invoice["released()"]()).to.equal(25);
    expect(await invoice["milestone()"]()).to.equal(2);
    await expect(receipt).to.emit(invoice, "Release").withArgs(1, 15);

    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(0);
    await expect(invoice["release()"]()).to.be.revertedWith("balance is 0");
  });

  it("Should revert release if locked", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    expect(lockedInvoice["release()"]()).to.be.revertedWith("locked");
  });

  it("Should release with milestone number", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    const receipt = await invoice["release(uint256)"](0);
    expect(await invoice["released()"]()).to.equal(10);
    expect(await invoice["milestone()"]()).to.equal(1);
    await expect(receipt).to.emit(invoice, "Release").withArgs(0, 10);
  });

  it("Should release with higher milestone number", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(20);
    await mockToken.mock.transfer.withArgs(provider.address, 20).returns(true);
    const receipt = await invoice["release(uint256)"](1);
    expect(await invoice["released()"]()).to.equal(20);
    expect(await invoice["milestone()"]()).to.equal(2);
    await expect(receipt).to.emit(invoice, "Release").withArgs(0, 10);
    await expect(receipt).to.emit(invoice, "Release").withArgs(1, 10);
  });

  it("Should release all with higher milestone number", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(25);
    await mockToken.mock.transfer.withArgs(provider.address, 25).returns(true);
    const receipt = await invoice["release(uint256)"](1);
    expect(await invoice["released()"]()).to.equal(25);
    expect(await invoice["milestone()"]()).to.equal(2);
    await expect(receipt).to.emit(invoice, "Release").withArgs(0, 10);
    await expect(receipt).to.emit(invoice, "Release").withArgs(1, 15);
  });

  it("Should revert release with higher milestone number", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    const receipt = invoice["release(uint256)"](1);
    await expect(receipt).to.revertedWith("insufficient balance");
  });

  it("Should revert release with invalid milestone number", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    const receipt = invoice["release(uint256)"](5);
    await expect(receipt).to.revertedWith("invalid milestone");
  });

  it("Should revert release with passed milestone number", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    await invoice["release()"]();
    const receipt = invoice["release(uint256)"](0);
    await expect(receipt).to.revertedWith("milestone passed");
  });

  it("Should revert release milestone if not client", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    invoice = await invoice.connect(provider);
    const receipt = invoice["release(uint256)"](0);
    await expect(receipt).to.revertedWith("!client");
  });

  it("Should revert release milestone if locked", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    await expect(lockedInvoice["release(uint256)"](0)).to.be.revertedWith(
      "locked",
    );
  });

  it("Should releaseTokens with passed token", async function () {
    await otherMockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await otherMockToken.mock.transfer
      .withArgs(provider.address, 10)
      .returns(true);
    await invoice["releaseTokens(address)"](otherMockToken.address);
  });

  it("Should call release if releaseTokens with invoice token", async function () {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    const receipt = await invoice["releaseTokens(address)"](mockToken.address);
    expect(await invoice["released()"]()).to.equal(10);
    expect(await invoice["milestone()"]()).to.equal(1);
    await expect(receipt).to.emit(invoice, "Release").withArgs(0, 10);
  });

  it("Should revert releaseTokens if not client", async function () {
    invoice = await invoice.connect(provider);
    const receipt = invoice["releaseTokens(address)"](otherMockToken.address);
    await expect(receipt).to.revertedWith("!client");
  });

  it("Should revert withdraw before terminationTime", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 3600,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );

    const receipt = invoice["withdraw()"]();
    await expect(receipt).to.revertedWith("!terminated");
  });

  it("Should revert withdraw if locked", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    await expect(lockedInvoice["withdraw()"]()).to.be.revertedWith("locked");
  });

  it("Should withdraw after terminationTime", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await waffleProvider.send("evm_setNextBlockTimestamp", [
      currentTime + 1000,
    ]);
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(client.address, 10).returns(true);

    const receipt = await invoice["withdraw()"]();
    expect(await invoice["milestone()"]()).to.equal(2);
    await expect(receipt).to.emit(invoice, "Withdraw").withArgs(10);
  });

  it("Should revert withdraw after terminationTime if balance is 0", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await waffleProvider.send("evm_setNextBlockTimestamp", [
      currentTime + 1000,
    ]);
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(0);

    const receipt = invoice["withdraw()"]();
    await expect(receipt).to.be.revertedWith("balance is 0");
  });

  it("Should call withdraw from withdrawTokens", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await waffleProvider.send("evm_setNextBlockTimestamp", [
      currentTime + 1000,
    ]);
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(client.address, 10).returns(true);

    const receipt = await invoice["withdrawTokens(address)"](mockToken.address);
    expect(await invoice["milestone()"]()).to.equal(2);
    await expect(receipt).to.emit(invoice, "Withdraw").withArgs(10);
  });

  it("Should withdrawTokens for otherToken", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await waffleProvider.send("evm_setNextBlockTimestamp", [
      currentTime + 1000,
    ]);
    await otherMockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await otherMockToken.mock.transfer
      .withArgs(client.address, 10)
      .returns(true);

    await invoice["withdrawTokens(address)"](otherMockToken.address);
    expect(await invoice["milestone()"]()).to.equal(0);
  });

  it("Should revert withdrawTokens for otherToken if not terminated", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );

    const receipt = invoice["withdrawTokens(address)"](otherMockToken.address);
    await expect(receipt).to.be.revertedWith("!terminated");
  });

  it("Should revert withdrawTokens for otherToken if balance is 0", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await waffleProvider.send("evm_setNextBlockTimestamp", [
      currentTime + 1000,
    ]);

    await otherMockToken.mock.balanceOf.withArgs(invoice.address).returns(0);
    const receipt = invoice["withdrawTokens(address)"](otherMockToken.address);
    await expect(receipt).to.be.revertedWith("balance is 0");
  });

  it("Should revert lock if terminated", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await waffleProvider.send("evm_setNextBlockTimestamp", [
      currentTime + 1000,
    ]);

    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    const receipt = invoice["lock(bytes32)"](EMPTY_BYTES32);
    await expect(receipt).to.be.revertedWith("terminated");
  });

  it("Should revert lock if balance is 0", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(0);
    const receipt = invoice["lock(bytes32)"](EMPTY_BYTES32);
    await expect(receipt).to.be.revertedWith("balance is 0");
  });

  it("Should revert lock if not client or provider", async function () {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    const invoiceWithResolver = await invoice.connect(resolver);
    const receipt = invoiceWithResolver["lock(bytes32)"](EMPTY_BYTES32);
    await expect(receipt).to.be.revertedWith("!party");
  });

  it("Should revert lock if locked", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    const receipt = lockedInvoice["lock(bytes32)"](EMPTY_BYTES32);
    await expect(receipt).to.be.revertedWith("locked");
  });

  it("Should lock if balance is greater than 0", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    expect(await lockedInvoice["locked()"]()).to.equal(true);
  });

  it("Should revert resolve if not locked", async function () {
    await expect(
      invoice["resolve(uint256,uint256,bytes32)"](0, 10, EMPTY_BYTES32),
    ).to.be.revertedWith("!locked");
  });

  it("Should revert resolve if balance is 0", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(0);
    await expect(
      lockedInvoice["resolve(uint256,uint256,bytes32)"](0, 10, EMPTY_BYTES32),
    ).to.be.revertedWith("balance is 0");
  });

  it("Should revert resolve if not resolver", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(10);
    await expect(
      lockedInvoice["resolve(uint256,uint256,bytes32)"](0, 10, EMPTY_BYTES32),
    ).to.be.revertedWith("!resolver");
  });

  it("Should revert resolve if awards do not add up", async function () {
    let lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    lockedInvoice = await lockedInvoice.connect(resolver);
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(10);
    await expect(
      lockedInvoice["resolve(uint256,uint256,bytes32)"](0, 0, EMPTY_BYTES32),
    ).to.be.revertedWith("resolution != remainder");
  });

  it("Should revert resolver if not individual", async function () {
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      arbitratorResolverType,
      resolver.address,
      mockWrappedNativeToken.address,
      amounts,
      terminationTime,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    expect(await invoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    await expect(
      invoice["resolve(uint256,uint256,bytes32)"](0, 0, EMPTY_BYTES32),
    ).to.be.revertedWith("!individual resolver");
  });

  it("Should resolve with correct rewards", async function () {
    let lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(client.address, 5).returns(true);
    await mockToken.mock.transfer.withArgs(provider.address, 90).returns(true);
    await mockToken.mock.transfer.withArgs(resolver.address, 5).returns(true);
    lockedInvoice = await lockedInvoice.connect(resolver);
    const receipt = lockedInvoice["resolve(uint256,uint256,bytes32)"](
      5,
      90,
      EMPTY_BYTES32,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Resolve")
      .withArgs(resolver.address, 5, 90, 5, EMPTY_BYTES32);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should resolve and not transfer if 0 clientAward", async function () {
    let lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(provider.address, 95).returns(true);
    await mockToken.mock.transfer.withArgs(resolver.address, 5).returns(true);
    lockedInvoice = await lockedInvoice.connect(resolver);
    const receipt = lockedInvoice["resolve(uint256,uint256,bytes32)"](
      0,
      95,
      EMPTY_BYTES32,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Resolve")
      .withArgs(resolver.address, 0, 95, 5, EMPTY_BYTES32);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should resolve and not transfer if 0 providerAward", async function () {
    let lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(client.address, 95).returns(true);
    await mockToken.mock.transfer.withArgs(resolver.address, 5).returns(true);
    lockedInvoice = await lockedInvoice.connect(resolver);
    const receipt = lockedInvoice["resolve(uint256,uint256,bytes32)"](
      95,
      0,
      EMPTY_BYTES32,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Resolve")
      .withArgs(resolver.address, 95, 0, 5, EMPTY_BYTES32);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should resolve and not transfer if 0 resolutionFee", async function () {
    let lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      2000,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(client.address, 5).returns(true);
    await mockToken.mock.transfer.withArgs(provider.address, 5).returns(true);
    lockedInvoice = await lockedInvoice.connect(resolver);
    const receipt = lockedInvoice["resolve(uint256,uint256,bytes32)"](
      5,
      5,
      EMPTY_BYTES32,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Resolve")
      .withArgs(resolver.address, 5, 5, 0, EMPTY_BYTES32);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should revert rule if not arbitrable", async function () {
    expect(await invoice["resolverType()"]()).to.be.equal(
      individualResolverType,
    );
    await expect(invoice["rule(uint256,uint256)"](0, 0)).to.be.revertedWith(
      "!arbitrator resolver",
    );
  });

  it("Should revert rule if not locked", async function () {
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      arbitratorResolverType,
      mockArbitrator.address,
      mockWrappedNativeToken.address,
      amounts,
      terminationTime,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken.address,
    );
    await expect(invoice["rule(uint256,uint256)"](0, 0)).to.be.revertedWith(
      "!locked",
    );
  });

  it("Should revert rule if not resolver", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    await expect(
      lockedInvoice["rule(uint256,uint256)"](0, 0),
    ).to.be.revertedWith("!resolver");
  });

  it("Should revert rule if invalid disputeId", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    const receipt = mockArbitrator.executeRulingWithDisputeId(
      lockedInvoice.address,
      6,
      10,
    );
    await expect(receipt).to.be.revertedWith("incorrect disputeId");
  });

  it("Should revert rule if invalid ruling", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    const receipt = mockArbitrator.executeRuling(lockedInvoice.address, 6);
    await expect(receipt).to.be.revertedWith("invalid ruling");
  });

  it("Should revert rule if balance is 0", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(0);
    const receipt = mockArbitrator.executeRuling(lockedInvoice.address, 0);
    await expect(receipt).to.be.revertedWith("balance is 0");
  });

  it("Should rule 1:1 for ruling 0", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(client.address, 50).returns(true);
    await mockToken.mock.transfer.withArgs(provider.address, 50).returns(true);
    const receipt = await mockArbitrator.executeRuling(
      lockedInvoice.address,
      0,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Rule")
      .withArgs(mockArbitrator.address, 50, 50, 0);
    await expect(receipt)
      .to.emit(lockedInvoice, "Ruling")
      .withArgs(mockArbitrator.address, 1, 0);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should rule 1:0 for ruling 1", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(client.address, 100).returns(true);
    const receipt = await mockArbitrator.executeRuling(
      lockedInvoice.address,
      1,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Rule")
      .withArgs(mockArbitrator.address, 100, 0, 1);
    await expect(receipt)
      .to.emit(lockedInvoice, "Ruling")
      .withArgs(mockArbitrator.address, 1, 1);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should rule 3:1 for ruling 2", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(client.address, 75).returns(true);
    await mockToken.mock.transfer.withArgs(provider.address, 25).returns(true);
    const receipt = await mockArbitrator.executeRuling(
      lockedInvoice.address,
      2,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Rule")
      .withArgs(mockArbitrator.address, 75, 25, 2);
    await expect(receipt)
      .to.emit(lockedInvoice, "Ruling")
      .withArgs(mockArbitrator.address, 1, 2);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should rule 1:1 for ruling 3", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(client.address, 50).returns(true);
    await mockToken.mock.transfer.withArgs(provider.address, 50).returns(true);
    const receipt = await mockArbitrator.executeRuling(
      lockedInvoice.address,
      3,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Rule")
      .withArgs(mockArbitrator.address, 50, 50, 3);
    await expect(receipt)
      .to.emit(lockedInvoice, "Ruling")
      .withArgs(mockArbitrator.address, 1, 3);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should rule 1:3 for ruling 4", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(client.address, 25).returns(true);
    await mockToken.mock.transfer.withArgs(provider.address, 75).returns(true);
    const receipt = await mockArbitrator.executeRuling(
      lockedInvoice.address,
      4,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Rule")
      .withArgs(mockArbitrator.address, 25, 75, 4);
    await expect(receipt)
      .to.emit(lockedInvoice, "Ruling")
      .withArgs(mockArbitrator.address, 1, 4);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should rule 0:1 for ruling 5", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      arbitratorResolverType,
      mockArbitrator,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
      10,
    );
    expect(await lockedInvoice["resolverType()"]()).to.be.equal(
      arbitratorResolverType,
    );
    expect(await lockedInvoice["disputeId()"]()).to.be.equal(1);

    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(provider.address, 100).returns(true);
    const receipt = await mockArbitrator.executeRuling(
      lockedInvoice.address,
      5,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, "Rule")
      .withArgs(mockArbitrator.address, 0, 100, 5);
    await expect(receipt)
      .to.emit(lockedInvoice, "Ruling")
      .withArgs(mockArbitrator.address, 1, 5);
    expect(await lockedInvoice["released()"]()).to.be.equal(0);
    expect(await lockedInvoice["milestone()"]()).to.be.equal(2);
    expect(await lockedInvoice["locked()"]()).to.be.equal(false);
  });

  it("Should revert receive if not wrappedNativeToken", async function () {
    const receipt = client.sendTransaction({
      to: invoice.address,
      value: 10,
    });
    await expect(receipt).to.be.revertedWith("!wrappedNativeToken");
  });

  it("Should revert receive if locked", async function () {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      EMPTY_BYTES32,
      mockWrappedNativeToken,
    );
    const receipt = client.sendTransaction({
      to: lockedInvoice.address,
      value: 10,
    });
    await expect(receipt).to.be.revertedWith("locked");
  });

  it("Should accept receive and convert to wrapped token", async function () {
    invoice = await SmartInvoice.deploy();
    await invoice.deployed();
    await invoice.init(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockWrappedNativeToken.address,
      amounts,
      terminationTime,
      resolutionRate,
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

const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const { deployMockContract, provider: waffleProvider } = waffle;
const { currentTimestamp, getLockedInvoice } = require("./utils");
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

describe("Verification Tests", function () {
  let SmartInvoice;
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
    [client, provider, resolver, randomSigner] = await ethers.getSigners();

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
      requireVerification,
    );
  });

  it("Should emit ClientVerified when client calls verify()", async function () {
    await expect(invoice.connect(client).verify())
      .to.emit(invoice, "ClientVerified")
      .withArgs(client.address, invoice.address);
  });

  it("Should not emit ClientVerified if caller !client", async function () {
    await expect(invoice.connect(randomSigner).verify()).to.be.reverted;
  });
});

const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const { deployMockContract, provider: waffleProvider } = waffle;
const {
  currentTimestamp,
  getLockedEscrow,
  awaitInvoiceAddress,
  createFeeEscrow,
} = require("./utils");
const IERC20 = require("../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");
const goerli = require("../deployments/goerli.json");

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const wmaticAddress = "0xDcfcef36F438ec310d8a699e3D3729398547b2BF";
const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const individualResolverType = 0;
const arbitratorResolverType = 1;
const amounts = [10, 10, 15];
const total = amounts.reduce((t, v) => t + v, 0);
const terminationTime =
  parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;
const resolutionRate = 20;
const requireVerification = true;
const invoiceType = ethers.utils.formatBytes32String("escrow");

describe("SmartInvoiceFeeEscrow", function () {
  let SmartInvoiceFeeEscrow;
  let FeeManager;
  let factory;
  let invoice;
  let mockToken;
  let wmaticContract;
  let mockArbitrator;
  let client;
  let provider;
  let resolver;
  let randomSigner;

  const createValidInvoice = async () => {
    const currentTime = await currentTimestamp();
    const tx = await createFeeEscrow(
      factory,
      invoiceType,
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      wmaticAddress,
      amounts,
      currentTime + 3600,
      EMPTY_BYTES32,
      wmaticAddress,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(await tx.wait());
    invoice = await SmartInvoiceFeeEscrow.attach(invoiceAddress);
    return invoice;
  };

  const depositAndRelease = async invoice => {};

  beforeEach(async function () {
    [client, provider, resolver, randomSigner] = await ethers.getSigners();

    wmaticContract = await ethers.getContractAt(
      IERC20.abi,
      wmaticAddress,
      client,
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x2559fF0F61870134a1d75cE3F271878DCDb0eEE1"],
    });

    const deployer = await ethers.getSigner(
      "0x2559fF0F61870134a1d75cE3F271878DCDb0eEE1",
    );

    const SmartInvoiceFactory = await ethers.getContractFactory(
      "SmartInvoiceFactory",
    );
    factory = SmartInvoiceFactory.attach(goerli.factory);

    SmartInvoiceFeeEscrow = await ethers.getContractFactory(
      "SmartInvoiceFeeEscrow",
    );
    invoice = await SmartInvoiceFeeEscrow.deploy();

    await invoice.deployed();

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
        client.address,
        individualResolverType,
        resolver.address,
        wmaticAddress,
        terminationTime, // exact termination date in seconds since epoch
        EMPTY_BYTES32,
        wmaticAddress,
        requireVerification,
        factory.address,
      ],
    );

    const receipt = await factory.create(
      provider.address,
      amounts,
      data,
      invoiceType,
    );

    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    invoice = SmartInvoiceFeeEscrow.attach(invoiceAddress);
  });

  it("Should deploy a SmartInvoiceFeeEscrow", async function () {
    expect(await invoice.client()).to.equal(client.address);
    expect(await invoice["provider()"]()).to.equal(provider.address);
    expect(await invoice.resolverType()).to.equal(individualResolverType);
    expect(await invoice.resolver()).to.equal(resolver.address);
    expect(await invoice.token()).to.equal(wmaticAddress);
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
    expect(await invoice.wrappedNativeToken()).to.equal(wmaticAddress);
    expect(await invoice.feePercentage()).to.equal(6);
  });
  it("Should be able to pay fees", async function () {
    const invoice = await createValidInvoice();
  });
});

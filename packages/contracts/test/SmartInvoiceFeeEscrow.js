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
const goerliWETHAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const goerliWhale = "0x88124Ef4A9EC47e691F254F2E8e348fd1e341e9B";

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
  let WETH;
  let mockArbitrator;
  let client;
  let provider;
  let resolver;
  let randomSigner;
  let whaleSigner;

  const createValidInvoice = async () => {
    const currentTime = await currentTimestamp();
    const tx = await createFeeEscrow(
      factory,
      invoiceType,
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      goerliWETHAddress,
      amounts,
      currentTime + 3600,
      EMPTY_BYTES32,
      goerliWETHAddress,
      requireVerification,
    );
    invoiceAddress = await awaitInvoiceAddress(await tx.wait());
    invoice = await SmartInvoiceFeeEscrow.attach(invoiceAddress);
    return invoice;
  };

  beforeEach(async function () {
    [client, provider, resolver, randomSigner] = await ethers.getSigners();

    WETH = await ethers.getContractAt(IERC20.abi, goerliWETHAddress, client);

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x2559fF0F61870134a1d75cE3F271878DCDb0eEE1"],
    });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [goerliWhale],
    });

    whaleSigner = await ethers.provider.getSigner(goerliWhale);

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
        goerliWETHAddress,
        terminationTime, // exact termination date in seconds since epoch
        EMPTY_BYTES32,
        goerliWETHAddress,
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
    expect(await invoice.token()).to.equal(goerliWETHAddress);
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
    expect(await invoice.wrappedNativeToken()).to.equal(goerliWETHAddress);
    expect(await invoice.feePercentage()).to.equal(6);
  });
  it("Should be able to pay fees", async function () {
    const initalProviderBalance = await WETH.balanceOf(provider.address);
    await ethers.provider.send("hardhat_setBalance", [
      client.address,
      "0x56BC75E2D63100000",
    ]);
    await ethers.provider.send("hardhat_setBalance", [
      goerliWhale,
      "0x56BC75E2D63100000",
    ]);
    const depositAmount = ethers.utils.parseEther("50");

    await WETH.connect(whaleSigner).transfer(client.address, depositAmount);

    await client.sendTransaction({
      to: invoice.address,
      value: depositAmount,
    });

    await invoice["release()"]();

    const firstRelease = ethers.utils.parseEther(amounts[0].toString());

    const feePercentage = await invoice.feePercentage();

    const expectedFee = firstRelease.mul(feePercentage).div(100);

    const expectedProviderAmount = firstRelease.sub(expectedFee);

    const newProviderBalance = initalProviderBalance.add(
      expectedProviderAmount,
    );

    // Now, if you want to compare the balances, you can do so directly using BigNumber methods or convert them to strings for logging.
    // For example:
    expect(newProviderBalance).to.equal(
      initalProviderBalance.add(expectedProviderAmount),
    );
  });
});

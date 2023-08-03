const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const { deployMockContract, provider: waffleProvider } = waffle;
const goerli = require("../deployments/goerli.json");
const {
  currentTimestamp,
  getLockedEscrow,
  awaitInvoiceAddress,
  createEscrow,
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
const invoiceType = ethers.utils.formatBytes32String("escrow");

describe("SmartInvoiceFeeEscrow", function () {
  let SmartInvoiceFeeEscrow;
  let FeeManager;
  let factory;
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

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x2559fF0F61870134a1d75cE3F271878DCDb0eEE1"],
    });

    const deployer = await ethers.getSigner(
      "0x2559fF0F61870134a1d75cE3F271878DCDb0eEE1",
    );

    const feeManager = await ethers.getContractAt(
      "FeeManager",
      "0x44B2A9A793B51410D1f164e259FB4BcD1996Bd6c",
    );
    console.log("Fee Manager Test: ", await feeManager.version());

    mockToken = await deployMockContract(client, IERC20.abi);
    otherMockToken = await deployMockContract(client, IERC20.abi);

    const MockWrappedTokenFactory = await ethers.getContractFactory("MockWETH");
    mockWrappedNativeToken = await MockWrappedTokenFactory.deploy();

    const MockArbitratorFactory = await ethers.getContractFactory(
      "MockArbitrator",
    );
    mockArbitrator = await MockArbitratorFactory.deploy(10);

    const SmartInvoiceFactory = await ethers.getContractFactory(
      "SmartInvoiceFactory",
    );
    factory = SmartInvoiceFactory.attach(goerli.factory);

    SmartInvoiceFeeEscrow = await ethers.getContractFactory(
      "SmartInvoiceFeeEscrow",
    );
    invoice = await SmartInvoiceFeeEscrow.deploy();
    await invoice.deployed();

    const result = await factory
      .connect(deployer)
      .addImplementation(
        ethers.utils.formatBytes32String("escrow"),
        invoice.address,
      );

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
        mockToken.address,
        terminationTime, // exact termination date in seconds since epoch
        EMPTY_BYTES32,
        mockWrappedNativeToken.address,
        requireVerification,
        factory.address,
      ],
    );

    const receipt = await factory.create(
      provider.address,
      amounts,
      data,
      ethers.utils.formatBytes32String("escrow"),
    );

    invoiceAddress = await awaitInvoiceAddress(await receipt.wait());
    invoice = SmartInvoiceFeeEscrow.attach(invoiceAddress);
  });

  it("Should deploy a SmartInvoiceFeeEscrow", async function () {
    // expect(await invoice.client()).to.equal(client.address);
    // expect(await invoice["provider()"]()).to.equal(provider.address);
    // expect(await invoice.resolverType()).to.equal(individualResolverType);
    // expect(await invoice.resolver()).to.equal(resolver.address);
    // expect(await invoice.token()).to.equal(mockToken.address);
    // amounts.map(async (v, i) => {
    //   expect(await invoice.amounts(i)).to.equal(v);
    // });
    // expect(await invoice.terminationTime()).to.equal(terminationTime);
    // expect(await invoice.details()).to.equal(EMPTY_BYTES32);
    // expect(await invoice.resolutionRate()).to.equal(20);
    // expect(await invoice.milestone()).to.equal(0);
    // expect(await invoice.total()).to.equal(total);
    // expect(await invoice.locked()).to.equal(false);
    // expect(await invoice.disputeId()).to.equal(0);
    // expect(await invoice.wrappedNativeToken()).to.equal(
    //   mockWrappedNativeToken.address,
    // );
  });
  // it("Should be able to pay fees", async function () {
  //   // Setup mock to handle the transferFrom call in the payFee function
  //   await mockToken.mock.transferFrom.returns(true);

  //   // Call the payFee function
  //   await invoice.payFee(mockToken.address, feeAmount);

  //   // Check that the totalFeesPaid variable in the contract has increased by the right amount
  //   expect(await invoice.totalFeesPaid()).to.equal(feeAmount);

  //   // Verify that transferFrom was called correctly
  //   expect("transferFrom").to.have.been.calledOnContractWith(mockToken, [
  //     client.address,
  //     invoice.address,
  //     feeAmount,
  //   ]);
  // });
});

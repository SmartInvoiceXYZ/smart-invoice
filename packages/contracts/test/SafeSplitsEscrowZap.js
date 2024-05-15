const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const {
  getZapData,
  getFactory,
  getWrappedTokenAddress,
} = require("../scripts/constants");

const safeAbi = require("./contracts/Safe.json");
const splitMainAbi = require("./contracts/SplitMain.json");
const escrowAbi =
  require("../build/contracts/SmartInvoiceSplitEscrow.sol/SmartInvoiceSplitEscrow.json").abi;
const wethAbi = require("./contracts/WETH9.json");

// set `owners` (sorted), `client`, and `resolver` in before
const ZAP_DATA = {
  percentAllocations: [50 * 1e4, 50 * 1e4], // raid party split percent allocations // current split main is 100% = 1e6
  milestoneAmounts: [
    ethers.BigNumber.from(10).mul(ethers.BigNumber.from(10).pow(18)),
    ethers.BigNumber.from(10).mul(ethers.BigNumber.from(10).pow(18)),
  ], // escrow milestone amounts
  threshold: 2, // threshold
  saltNonce: Math.floor(new Date().getTime() / 1000), // salt nonce
  arbitration: 1,
  isDaoSplit: false, // isDaoSplit
  isProjectSplit: true, // isProjectSplit
  token: getWrappedTokenAddress(5), // token
  escrowDeadline: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60, // deadline
  details: formatBytes32String("ipfs://"), // details
  fallbackHandler: "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4",
};

// use forked goerli for tests to avoid deploying dependency contracts
const chainId = 5;

describe("SafeSplitsEscrowZap", function () {
  let deployer;
  let alternate;
  let factory;
  let implementation;
  let zap;
  let zapData = getZapData(chainId);
  let safe;
  let splitMain;
  let split;
  let escrow;
  let token;
  let i = 0;

  before(async function () {
    [deployer, alternate, client, resolver] = await ethers.getSigners();
    token = new ethers.Contract(ZAP_DATA.token, wethAbi, deployer);

    ZAP_DATA.owners = [deployer.address, alternate.address].sort();
    ZAP_DATA.client = client.address;
    ZAP_DATA.resolver = resolver.address;

    // deploy zap implementation
    const SafeSplitsEscrowZapImplementation = await ethers.getContractFactory(
      "SafeSplitsEscrowZap",
    );
    implementation = await SafeSplitsEscrowZapImplementation.deploy();
    await implementation.deployed();
    expect(implementation).to.not.be.null;
    expect(implementation.address).to.not.equal(ethers.constants.AddressZero);

    // deploy zap factory
    const SafeSplitsEscrowZapFactory = await ethers.getContractFactory(
      "SafeSplitsEscrowZapFactory",
    );
    factory = await SafeSplitsEscrowZapFactory.deploy(implementation.address);
    await factory.deployed();
    expect(factory).to.not.be.null;
    expect(factory.address).to.not.equal(ethers.constants.AddressZero);

    // deploy zap instance
    const zapDeployData = [
      zapData.safeSingleton, //               singleton
      ZAP_DATA.fallbackHandler, //            fallback handler
      zapData.safeFactory, //                 safe factory
      zapData.splitMain, //                   split main
      getFactory(chainId), //                 escrow factory
      getWrappedTokenAddress(chainId), //     wrapped token
    ];
    const encodedData = defaultAbiCoder.encode(
      ["address", "address", "address", "address", "address", "address"],
      zapDeployData,
    );
    const SafeSplitsEscrowZapReceipt = await factory.createSafeSplitsEscrowZap(
      encodedData,
      formatBytes32String(String(ZAP_DATA.saltNonce)),
    );
    const zapDeploy = await SafeSplitsEscrowZapReceipt.wait();
    const zapAddress = zapDeploy.logs[0].address;
    zap = await ethers.getContractAt("SafeSplitsEscrowZap", zapAddress);
  });

  beforeEach(async function () {
    i++; // increment to avoid nonce collisions in Create2 deployments

    // create with zap
    const encodedSafeData = defaultAbiCoder.encode(
      ["uint256", "uint256"],
      [ZAP_DATA.threshold, ZAP_DATA.saltNonce + i],
    );
    const encodedSplitData = defaultAbiCoder.encode(
      ["bool"],
      [ZAP_DATA.isProjectSplit],
    );
    const encodedEscrowData = defaultAbiCoder.encode(
      [
        "address",
        "uint32",
        "address",
        "address",
        "uint256",
        "uint256",
        "bytes32",
      ],
      [
        ZAP_DATA.client,
        ZAP_DATA.arbitration,
        ZAP_DATA.resolver,
        ZAP_DATA.token,
        ZAP_DATA.escrowDeadline,
        ZAP_DATA.saltNonce + i,
        ZAP_DATA.details,
      ],
    );

    const SafeSplitsEscrowZapCreateReceipt = await zap.createSafeSplitEscrow(
      ZAP_DATA.owners,
      ZAP_DATA.percentAllocations,
      ZAP_DATA.milestoneAmounts,
      encodedSafeData,
      ethers.constants.AddressZero, // safe address,
      encodedSplitData, // split data,
      encodedEscrowData,
    );
    const zapCreateTx = await SafeSplitsEscrowZapCreateReceipt.wait();
    const zapCreatedEvent = zapCreateTx.events.find(
      e => e.event === "SafeSplitsEscrowCreated",
    );
    // parse create with zap event
    const [safeAddress, splitAddress, escrowAddress] =
      defaultAbiCoder.decode(
        ["address", "address", "address"],
        zapCreatedEvent.data,
      );
    safe = new ethers.Contract(safeAddress, safeAbi, deployer);
    splitMain = new ethers.Contract(zapData.splitMain, splitMainAbi, deployer);
    escrow = await ethers.getContractAt("SmartInvoiceUpdatable", escrowAddress);
    split = splitAddress;
  });

  it("Should deploy a Zap instance", async function () {
    expect(zap.address).to.not.equal(ethers.constants.AddressZero);
    expect(await zap.safeSingleton()).to.equal(zapData.safeSingleton);
    expect(await zap.safeFactory()).to.equal(zapData.safeFactory);
    expect(await zap.splitMain()).to.equal(zapData.splitMain);
    expect(await zap.escrowFactory()).to.equal(getFactory(chainId));
    expect(await zap.wrappedNativeToken()).to.equal(
      getWrappedTokenAddress(chainId),
    );
  });

  it("Should create a Safe", async function () {
    expect(safe.address).to.not.equal(ethers.constants.AddressZero);
    expect(await safe.getThreshold()).to.equal(ZAP_DATA.threshold);
    expect(await safe.getOwners()).to.deep.equal(ZAP_DATA.owners);
  });

  it("Should create a Split", async function () {
    expect(split).to.not.equal(ethers.constants.AddressZero);
    expect(await splitMain.getController(split)).to.equal(safe.address);
  });

  it("Should create an Escrow", async function () {
    expect(escrow.address).to.not.equal(ethers.constants.AddressZero);
    expect(await escrow.locked()).to.equal(false);
    expect(await escrow.client()).to.equal(ZAP_DATA.client);
    expect(await escrow.resolverType()).to.equal(ZAP_DATA.arbitration);
    expect(await escrow.resolver()).to.equal(ZAP_DATA.resolver);
    expect(await escrow.token()).to.equal(ZAP_DATA.token);
    expect(await escrow.terminationTime()).to.equal(ZAP_DATA.escrowDeadline);
    expect(await escrow.details()).to.equal(ZAP_DATA.details);
    expect(await escrow.providerReceiver()).to.equal(split);
    expect(await escrow["provider()"]()).to.equal(safe.address); // `escrow.provider()` is not a function?
  });

  it("Should let the client deposit into the Escrow", async function () {
    const amount = ZAP_DATA.milestoneAmounts[0];
    const clientToken = new ethers.Contract(ZAP_DATA.token, wethAbi, client);
    await clientToken.deposit({ value: amount });
    await clientToken.transfer(escrow.address, amount);
    expect(await clientToken.balanceOf(escrow.address)).to.equal(amount);
  });

  it("Should let the client deposit into the Escrow with a fallback", async function () {
    const amount = ZAP_DATA.milestoneAmounts[0];
    await client.sendTransaction({
      to: escrow.address,
      value: amount,
    });
    expect(await token.balanceOf(escrow.address)).to.equal(amount);
  });

  it("Should let the client deposit a milestone and release it", async function () {
    const amount = ZAP_DATA.milestoneAmounts[0];
    const clientToken = new ethers.Contract(ZAP_DATA.token, wethAbi, client);
    const startingDeployerBalance = await clientToken.balanceOf(
      deployer.address,
    );
    const startingAlternateBalance = await clientToken.balanceOf(
      alternate.address,
    );
    await clientToken.deposit({ value: amount });
    await clientToken.transfer(escrow.address, amount);
    expect(await clientToken.balanceOf(escrow.address)).to.equal(amount);
    const clientEscrow = new ethers.Contract(escrow.address, escrowAbi, client);
    await clientEscrow["release(uint256)"](0);
    expect(await clientToken.balanceOf(split)).to.equal(amount);
    await splitMain.distributeERC20(
      split,
      ZAP_DATA.token,
      ZAP_DATA.owners.sort(),
      ZAP_DATA.percentAllocations,
      0,
      deployer.address,
    );
    expect(await clientToken.balanceOf(split)).to.equal(1); // erc20 split leaves 1 for gas efficiency
    const deployerWithdrawReceipt = await splitMain.withdraw(
      deployer.address,
      0,
      [ZAP_DATA.token],
    );
    const alternateWithdrawReceipt = await splitMain.withdraw(
      alternate.address,
      0,
      [ZAP_DATA.token],
    );
    await deployerWithdrawReceipt.wait();
    await alternateWithdrawReceipt.wait();
    expect(
      (await token.balanceOf(deployer.address)).sub(startingDeployerBalance),
    ).to.equal(amount.div(2).sub(2)); // the math works?
    expect(
      (await token.balanceOf(alternate.address)).sub(startingAlternateBalance),
    ).to.equal(amount.div(2).sub(2));
  });

  // it should let the safe update the split - handle from Safe UI for now
});

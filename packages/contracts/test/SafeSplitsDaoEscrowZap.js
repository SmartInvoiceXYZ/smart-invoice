const { expect } = require("chai");
const { ethers } = require("hardhat");

const { currentTimestamp } = require("./utils");

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
  isDaoSplit: true,
  isProjectSplit: true,
  token: getWrappedTokenAddress(5),
  escrowDeadline: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
  details: ethers.utils.formatBytes32String("ipfs://"),
  fallbackHandler: "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4",
};

// use forked goerli for tests to avoid deploying dependency contracts
const chainId = 5;

describe("SafeSplitsDaoEscrowZap", function () {
  let deployer;
  let alternate;
  let factory;
  let implementation;
  let zap;
  let zapData = getZapData(chainId);
  let safe;
  let spoilsManager;
  let splitMain;
  let teamSplit;
  let daoSplit;
  let daoReceiver;
  let escrow;
  let token;
  let receiver;
  let i = 0;

  before(async function () {
    [deployer, alternate, client, resolver, receiver] =
      await ethers.getSigners();
    token = new ethers.Contract(ZAP_DATA.token, wethAbi, deployer);

    ZAP_DATA.owners = [deployer.address, alternate.address].sort();
    ZAP_DATA.client = client.address;
    ZAP_DATA.resolver = resolver.address;

    const spoilsValues = {
      spoils: 10, // out of 100
      receiver: receiver.address,
      newOwner: zapData.dao,
      percentageScale: 1e4,
    };

    // * deploy spoils manager
    const SpoilsManagerImplementation =
      await ethers.getContractFactory("SpoilsManager");

    const spoilsMgrImplementation = await SpoilsManagerImplementation.deploy();
    await spoilsMgrImplementation.deployed();
    expect(spoilsMgrImplementation.address).to.not.equal(
      ethers.constants.AddressZero,
    );

    const SpoilsManagerFactory = await ethers.getContractFactory(
      "SpoilsManagerFactory",
    );
    factory = await SpoilsManagerFactory.deploy(
      spoilsMgrImplementation.address,
    );
    await factory.deployed();
    expect(factory.address).to.not.equal(ethers.constants.AddressZero);

    const spoilsManagerReceipt = await factory.createSpoilsManager(
      spoilsValues.spoils,
      spoilsValues.percentageScale,
      spoilsValues.receiver,
      spoilsValues.newOwner,
      ethers.utils.formatBytes32String(String(currentTimestamp())),
    );
    const spoilsManagerDeploy = await spoilsManagerReceipt.wait();
    const spoilsManagerAddress = spoilsManagerDeploy.logs[0].address;
    spoilsManager = await ethers.getContractAt(
      "SpoilsManager",
      spoilsManagerAddress,
    );
    expect(spoilsManager.address).to.not.equal(ethers.constants.AddressZero);

    // * deploy zap implementation
    const SafeSplitsDaoEscrowZapImplementation =
      await ethers.getContractFactory("SafeSplitsDaoEscrowZap");
    implementation = await SafeSplitsDaoEscrowZapImplementation.deploy();
    await implementation.deployed();
    expect(implementation).to.not.be.null;
    expect(implementation.address).to.not.equal(ethers.constants.AddressZero);

    // * deploy zap factory
    const SafeSplitsEscrowZapFactory = await ethers.getContractFactory(
      "SafeSplitsEscrowZapFactory",
    );
    factory = await SafeSplitsEscrowZapFactory.deploy(implementation.address);
    await factory.deployed();
    expect(factory).to.not.be.null;
    expect(factory.address).to.not.equal(ethers.constants.AddressZero);

    // * deploy zap instance
    const zapDeployData = [
      zapData.safeSingleton, //               singleton
      ZAP_DATA.fallbackHandler, //            fallback handler
      zapData.safeFactory, //                 safe factory
      zapData.splitMain, //                   split main
      spoilsManager.address, //               spoils manager
      getFactory(chainId), //                 escrow factory
      getWrappedTokenAddress(chainId), //     wrapped token
      zapData.dao, //                         dao
    ];
    const encodedData = ethers.utils.defaultAbiCoder.encode(
      [
        "address",
        "address",
        "address",
        "address",
        "address",
        "address",
        "address",
        "address",
      ],
      zapDeployData,
    );
    const SafeSplitsDaoEscrowZapReceipt =
      await factory.createSafeSplitsEscrowZap(
        encodedData,
        ethers.utils.formatBytes32String(String(ZAP_DATA.saltNonce)),
      );
    const zapDeploy = await SafeSplitsDaoEscrowZapReceipt.wait();
    const zapAddress = zapDeploy.logs[0].address;
    zap = await ethers.getContractAt("SafeSplitsDaoEscrowZap", zapAddress);
  });

  beforeEach(async function () {
    i++; // increment to avoid nonce collisions in Create2 deployments

    // create with zap
    const encodedSafeData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256"],
      [ZAP_DATA.threshold, ZAP_DATA.saltNonce + i],
    );
    const encodedSplitData = ethers.utils.defaultAbiCoder.encode(
      ["bool", "bool"],
      [ZAP_DATA.isProjectSplit, ZAP_DATA.isDaoSplit],
    );
    const encodedEscrowData = ethers.utils.defaultAbiCoder.encode(
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
      ethers.constants.AddressZero,
      encodedSplitData,
      encodedEscrowData,
    );
    const zapCreateTx = await SafeSplitsEscrowZapCreateReceipt.wait();
    const zapCreatedEvent = zapCreateTx.events.find(
      e => e.event === "SafeSplitsDaoEscrowCreated",
    );
    // parse create with zap event
    const [safeAddress, teamSplitAddress, daoSplitAddress, escrowAddress] =
      ethers.utils.defaultAbiCoder.decode(
        ["address", "address", "address", "address"],
        zapCreatedEvent.data,
      );
    safe = new ethers.Contract(safeAddress, safeAbi, deployer);
    splitMain = new ethers.Contract(zapData.splitMain, splitMainAbi, deployer);
    escrow = await ethers.getContractAt("SmartInvoiceUpdatable", escrowAddress);
    daoReceiver = await spoilsManager.receiver();
    teamSplit = teamSplitAddress;
    daoSplit = daoSplitAddress;
  });

  it("Should deploy a SpoilsManager instance", async function () {
    expect(spoilsManager.address).to.not.equal(ethers.constants.AddressZero);
    expect(await spoilsManager.spoils()).to.equal(10);
    expect(await spoilsManager.receiver()).to.equal(receiver.address);
    expect(await spoilsManager.owner()).to.equal(zapData.dao);
  });

  it("Should deploy a Zap instance", async function () {
    expect(zap.address).to.not.equal(ethers.constants.AddressZero);
    expect(await zap.safeSingleton()).to.equal(zapData.safeSingleton);
    expect(await zap.safeFactory()).to.equal(zapData.safeFactory);
    expect(await zap.splitMain()).to.equal(zapData.splitMain);
    expect(await zap.spoilsManager()).to.equal(spoilsManager.address);
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

  it("Should create a project team Split", async function () {
    expect(teamSplit).to.not.equal(ethers.constants.AddressZero);
    expect(await splitMain.getController(teamSplit)).to.equal(safe.address);
  });

  it("Should create a dao Split", async function () {
    expect(daoSplit).to.not.equal(ethers.constants.AddressZero);
    expect(await splitMain.getController(daoSplit)).to.equal(zapData.dao);
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
    expect(await escrow.providerReceiver()).to.equal(daoSplit);
    expect(await escrow["provider()"]()).to.equal(zapData.dao);
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
    const startingDaoReceiver = await clientToken.balanceOf(daoReceiver);
    const startingDeployerBalance = await clientToken.balanceOf(
      deployer.address,
    );
    const startingAlternateBalance = await clientToken.balanceOf(
      alternate.address,
    );
    await clientToken.deposit({ value: amount });
    await clientToken.transfer(escrow.address, amount);
    expect(await clientToken.balanceOf(escrow.address)).to.equal(amount);
    // release escrow
    const clientEscrow = new ethers.Contract(escrow.address, escrowAbi, client);
    await clientEscrow["release(uint256)"](0);
    expect(await clientToken.balanceOf(daoSplit)).to.equal(amount);
    const daoSplitSetup = [
      { address: await spoilsManager.receiver(), percent: 10 * 1e4 },
      { address: teamSplit, percent: 90 * 1e4 },
    ].sort((a, b) => a.address.localeCompare(b.address));
    // process dao split
    await splitMain.distributeERC20(
      daoSplit,
      ZAP_DATA.token,
      daoSplitSetup.map(({ address }) => address),
      daoSplitSetup.map(({ percent }) => percent),
      0,
      deployer.address,
    );
    expect(await clientToken.balanceOf(daoSplit)).to.equal(1); // erc20 split leaves 1 for gas efficiency

    const daoReceiverWithdrawReceipt = await splitMain.withdraw(
      daoReceiver,
      0,
      [ZAP_DATA.token],
    );
    const teamSplitWithdrawReceipt = await splitMain.withdraw(teamSplit, 0, [
      ZAP_DATA.token,
    ]);
    await daoReceiverWithdrawReceipt.wait();
    await teamSplitWithdrawReceipt.wait();

    expect(await clientToken.balanceOf(daoReceiver)).to.equal(
      startingDaoReceiver.add(amount.mul(10).div(100)).sub(2),
    );
    const teamSplitAmount = await clientToken.balanceOf(teamSplit);
    expect(teamSplitAmount).to.equal(amount.mul(90).div(100).sub(2));

    // process team split
    await splitMain.distributeERC20(
      teamSplit,
      ZAP_DATA.token,
      ZAP_DATA.owners,
      ZAP_DATA.percentAllocations,
      0,
      deployer.address,
    );
    expect(await clientToken.balanceOf(teamSplit)).to.equal(1);

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

    expect(await clientToken.balanceOf(deployer.address)).to.equal(
      startingDeployerBalance.add(teamSplitAmount.div(2)).sub(2),
    );
    expect(await clientToken.balanceOf(alternate.address)).to.equal(
      startingAlternateBalance.add(teamSplitAmount.div(2)).sub(2),
    );
  });

  // it should let the safe update the split - handle from Safe UI for now
});

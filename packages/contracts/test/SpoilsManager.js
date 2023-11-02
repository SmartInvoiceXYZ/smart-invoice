const { expect } = require("chai");
const { ethers } = require("hardhat");

const { currentTimestamp } = require("./utils");

describe("SpoilsManagerFactory", function () {
  let deployer;
  let receiver;
  let factory;
  let implementation;
  let spoilsValues;

  beforeEach(async function () {
    [deployer, receiver] = await ethers.getSigners();

    const SpoilsManagerImplementation =
      await ethers.getContractFactory("SpoilsManager");
    implementation = await SpoilsManagerImplementation.deploy();
    await implementation.deployed();
    expect(implementation.address).to.not.equal(ethers.constants.AddressZero);

    const SpoilsManagerFactory = await ethers.getContractFactory(
      "SpoilsManagerFactory",
    );
    factory = await SpoilsManagerFactory.deploy(implementation.address);
    await factory.deployed();
    expect(factory.address).to.not.equal(ethers.constants.AddressZero);

    spoilsValues = {
      spoils: 10, // out of 100
      receiver: receiver.address,
      newOwner: receiver.address,
      percentageScale: 1e4,
    };
  });

  it("Should deploy new SpoilsManager", async function () {
    const spoilsManagerReceipt = await factory.createSpoilsManager(
      spoilsValues.spoils,
      spoilsValues.percentageScale,
      spoilsValues.receiver,
      spoilsValues.newOwner,
      ethers.utils.formatBytes32String(String(currentTimestamp())),
    );
    const spoilsManagerDeploy = await spoilsManagerReceipt.wait();
    const spoilsManagerAddress = spoilsManagerDeploy.logs[0].address;
    const spoilsManager = await ethers.getContractAt(
      "SpoilsManager",
      spoilsManagerAddress,
    );
    expect(spoilsManager.address).to.not.equal(ethers.constants.AddressZero);
    expect(await spoilsManager.spoils()).to.equal(spoilsValues.spoils);
    expect(await spoilsManager.receiver()).to.equal(spoilsValues.receiver);
    expect(await spoilsManager.owner()).to.equal(spoilsValues.newOwner);
  });

  it("Should revert if spoils is 0", async function () {
    await expect(
      factory.createSpoilsManager(
        0,
        spoilsValues.percentageScale,
        spoilsValues.receiver,
        spoilsValues.newOwner,
        ethers.utils.formatBytes32String(String(currentTimestamp())),
      ),
    ).to.be.revertedWith("InvalidSpoilsAmount()");
  });

  it("Should revert if receiver is 0", async function () {
    await expect(
      factory.createSpoilsManager(
        spoilsValues.spoils,
        spoilsValues.percentageScale,
        ethers.constants.AddressZero,
        spoilsValues.newOwner,
        ethers.utils.formatBytes32String(String(currentTimestamp())),
      ),
    ).to.be.revertedWith("InvalidReceiverAddress()");
  });

  it("Should not revert if newOwner is 0", async function () {
    await expect(
      factory.createSpoilsManager(
        spoilsValues.spoils,
        spoilsValues.percentageScale,
        spoilsValues.receiver,
        ethers.constants.AddressZero,
        ethers.utils.formatBytes32String(String(currentTimestamp())),
      ),
    ).to.not.be.reverted;
  });

  it("Should revert if salt is unset", async function () {
    await expect(
      factory.createSpoilsManager(
        spoilsValues.spoils,
        spoilsValues.percentageScale,
        spoilsValues.receiver,
        spoilsValues.newOwner,
        0,
      ),
    ).to.be.reverted;
  });

  it("Should stay with deployer, if newOwner not set", async function () {
    const spoilsManagerReceipt = await factory.createSpoilsManager(
      spoilsValues.spoils,
      spoilsValues.percentageScale,
      spoilsValues.receiver,
      ethers.constants.AddressZero,
      ethers.utils.formatBytes32String(String(currentTimestamp())),
    );
    const spoilsManagerDeploy = await spoilsManagerReceipt.wait();
    const spoilsManagerAddress = spoilsManagerDeploy.logs[0].address;
    const spoilsManager = await ethers.getContractAt(
      "SpoilsManager",
      spoilsManagerAddress,
    );
    expect(await spoilsManager.owner()).to.equal(deployer.address);
  });

  it("Should not be initialized again", async function () {
    const spoilsManagerReceipt = await factory.createSpoilsManager(
      spoilsValues.spoils,
      spoilsValues.percentageScale,
      spoilsValues.receiver,
      ethers.constants.AddressZero,
      ethers.utils.formatBytes32String(String(currentTimestamp())),
    );
    const spoilsManagerDeploy = await spoilsManagerReceipt.wait();
    const spoilsManagerAddress = spoilsManagerDeploy.logs[0].address;
    const spoilsManager = await ethers.getContractAt(
      "SpoilsManager",
      spoilsManagerAddress,
    );
    await expect(
      spoilsManager.init(
        spoilsValues.spoils,
        spoilsValues.percentageScale,
        spoilsValues.receiver,
        spoilsValues.newOwner,
      ),
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });
});

describe("SpoilsManager", function () {
  let deployer;
  let receiver;
  let receiver2;
  let factory;
  let implementation;
  let spoilsManager;
  let spoilsValues;

  beforeEach(async function () {
    [deployer, receiver, receiver2] = await ethers.getSigners();

    const SpoilsManagerImplementation =
      await ethers.getContractFactory("SpoilsManager");
    implementation = await SpoilsManagerImplementation.deploy();
    await implementation.deployed();
    expect(implementation.address).to.not.equal(ethers.constants.AddressZero);

    const SpoilsManagerFactory = await ethers.getContractFactory(
      "SpoilsManagerFactory",
    );
    factory = await SpoilsManagerFactory.deploy(implementation.address);
    await factory.deployed();
    expect(factory.address).to.not.equal(ethers.constants.AddressZero);

    spoilsValues = {
      spoils: 10, // out of 100
      percentageScale: 1e4,
      receiver: receiver.address,
      newOwner: receiver.address,
    };

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
  });

  it("Should have initial values", async function () {
    const rawSpoils = await spoilsManager.spoils();
    expect(rawSpoils).to.equal(spoilsValues.spoils);
    expect(await spoilsManager.receiver()).to.equal(spoilsValues.receiver);
    expect(await spoilsManager.owner()).to.equal(spoilsValues.newOwner);
    const spoilsScale = await spoilsManager.SPLIT_PERCENTAGE_SCALE();
    expect(await spoilsManager.getSpoils()).to.equal(rawSpoils * spoilsScale);
  });

  it("Should allow owner to update spoils", async function () {
    const newSpoils = 15;
    await spoilsManager.connect(receiver).setSpoils(newSpoils);
    expect(await spoilsManager.spoils()).to.equal(newSpoils);
  });

  it("Should not allow non-owner to update spoils", async function () {
    const newSpoils = 15;
    await expect(
      spoilsManager.connect(deployer).setSpoils(newSpoils),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should allow owner to update receiver", async function () {
    const newReceiver = receiver2.address;
    await spoilsManager.connect(receiver).setReceiver(newReceiver);
    expect(await spoilsManager.receiver()).to.equal(newReceiver);
  });

  it("Should not allow non-owner to update receiver", async function () {
    const newReceiver = receiver2.address;
    await expect(
      spoilsManager.connect(deployer).setReceiver(newReceiver),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FeeManager", function () {
  let FeeManager;
  let feeManager;
  let owner;
  let addr1;
  let addr2;
  const feePercentage = 10;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    FeeManager = await ethers.getContractFactory("FeeManager");
    feeManager = await FeeManager.deploy();

    await feeManager.deployed();
  });

  it("Should set owner on constructor", async function () {
    expect(await feeManager.owner()).to.equal(owner.address);
  });

  it("Should set fee percentage", async function () {
    await feeManager.connect(owner).setFeePercentage(feePercentage);
    expect(await feeManager.feePercentage()).to.equal(feePercentage);
  });

  it("Should revert setting fee percentage if not owner", async function () {
    await expect(
      feeManager.connect(addr1).setFeePercentage(feePercentage),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should set exemption", async function () {
    const endDate = Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7; // one week later
    await feeManager.connect(owner).setExemption(1, endDate, addr1.address);
    const exemption = await feeManager.feeExempt(addr1.address);
    expect(exemption.exemptionType).to.equal(1);
    expect(exemption.endDate).to.equal(endDate);
  });

  it("Should revert setting exemption if not owner", async function () {
    const endDate = Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7; // one week later
    await expect(
      feeManager.connect(addr1).setExemption(1, endDate, addr1.address),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should calculate invoice fee correctly", async function () {
    const amount = 1000;
    const expectedFee = (amount * feePercentage) / 100;
    await feeManager.connect(owner).setFeePercentage(feePercentage);
    const fee = await feeManager.calculateInvoiceFee(amount, addr2.address);
    expect(fee).to.equal(expectedFee);
  });

  it("Should calculate invoice fee as zero for exempted addresses", async function () {
    const amount = 1000;
    const endDate = Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7; // one week later
    await feeManager.connect(owner).setFeePercentage(feePercentage);
    await feeManager.connect(owner).setExemption(1, endDate, addr1.address);
    const fee = await feeManager.calculateInvoiceFee(amount, addr1.address);
    expect(fee).to.equal(0);
  });
});

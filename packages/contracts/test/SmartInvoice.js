const { expect } = require("chai");
const { waffle } = require("hardhat");
const { deployMockContract, provider } = waffle;
const IERC20 = require("../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json");
// const { Contract, BigNumber } = require("ethers");

const EMPTY_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
// const WETH_XDAI = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d";
// const WETH_RINKEBY = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

describe("SmartInvoice", async () => {
  let SmartInvoice;
  let invoice;
  let mockToken;
  let client;
  let provider;
  let resolverType = 0;
  let resolver;
  let amounts = [10, 10];
  let total = amounts.reduce((t, v) => t + v, 0);
  let terminationTime =
    parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;
  let resolutionRate = 20;
  let details = EMPTY_BYTES32;

  beforeEach(async () => {
    [client, provider, resolver] = await ethers.getSigners();
    SmartInvoice = await ethers.getContractFactory("SmartInvoice");
    mockToken = await deployMockContract(client, IERC20.abi);

    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      resolverType,
      resolver.address,
      mockToken.address,
      amounts,
      terminationTime,
      resolutionRate,
      details,
    );

    await invoice.deployed();
  });

  it("Should deploy a SmartInvoice", async () => {
    expect(await invoice.client()).to.equal(client.address);
    expect((await invoice.functions.provider())[0]).to.equal(provider.address);
    expect(await invoice.resolverType()).to.equal(resolverType);
    expect(await invoice.resolver()).to.equal(resolver.address);
    expect(await invoice.token()).to.equal(mockToken.address);
    amounts.map(async (v, i) => {
      expect(await invoice.amounts(i)).to.equal(v);
    });
    expect(await invoice.terminationTime()).to.equal(terminationTime);
    expect(await invoice.details()).to.equal(details);
    expect(await invoice.resolutionRate()).to.equal(20);
    expect(await invoice.milestone()).to.equal(0);
    expect(await invoice.total()).to.equal(total);
    expect(await invoice.locked()).to.equal(false);
    expect(await invoice.disputeId()).to.equal(0);
  });

  it("Should revert on release by non client", async () => {
    invoice = await invoice.connect(provider);
    await expect(invoice["release()"]()).to.be.revertedWith("!client");
  });

  it("Should revert on release with low balance", async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(5);
    await expect(invoice["release()"]()).to.be.revertedWith(
      "insufficient balance",
    );
  });

  it("Should release", async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    const receipt = await invoice['release()']();
    expect(await invoice["released()"]()).to.equal(10);
    expect(await invoice["milestone()"]()).to.equal(1);
    expect(receipt)
      .to.emit(invoice, "Release")
      .withArgs(0, 10);
  });

  it("Should release full balance at last milestone", async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice['release()']();
    expect(await invoice["released()"]()).to.equal(10);
    expect(await invoice["milestone()"]()).to.equal(1);
    expect(receipt)
      .to.emit(invoice, "Release")
      .withArgs(0, 10);
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(15);
    await mockToken.mock.transfer.withArgs(provider.address, 15).returns(true);
    receipt = await invoice['release()']();
    expect(await invoice["released()"]()).to.equal(25);
    expect(await invoice["milestone()"]()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, "Release")
      .withArgs(1, 15);
  });

  it("Should release full balance after all milestones are completed", async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice['release()']();
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(15);
    await mockToken.mock.transfer.withArgs(provider.address, 15).returns(true);
    receipt = await invoice['release()']();
    expect(await invoice["released()"]()).to.equal(25);
    expect(await invoice["milestone()"]()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, "Release")
      .withArgs(1, 15);
    
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(20);
    await mockToken.mock.transfer.withArgs(provider.address, 20).returns(true);
    receipt = await invoice['release()']();
    expect(await invoice["released()"]()).to.equal(45);
    expect(await invoice["milestone()"]()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, "Release")
      .withArgs(2, 20);
  });

  it("Should revert if 0 balance after all milestones are completed", async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice['release()']();
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(15);
    await mockToken.mock.transfer.withArgs(provider.address, 15).returns(true);
    receipt = await invoice['release()']();
    expect(await invoice["released()"]()).to.equal(25);
    expect(await invoice["milestone()"]()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, "Release")
      .withArgs(1, 15);
    
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(0);
    await expect(invoice["release()"]()).to.be.revertedWith("balance is 0");
  });

  it("Should release with milestone number", async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    receipt = await invoice['release(uint256)'](0);
    expect(await invoice["released()"]()).to.equal(10);
    expect(await invoice["milestone()"]()).to.equal(1);
    expect(receipt)
      .to.emit(invoice, "Release")
      .withArgs(0, 10);
  });

  // it("Should release with milestone number", async () => {
  //   await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
  //   await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
  //   receipt = await invoice['release(uint256)'](0);
  //   expect(await invoice["released()"]()).to.equal(10);
  //   expect(await invoice["milestone()"]()).to.equal(1);
  //   expect(receipt)
  //     .to.emit(invoice, "Release")
  //     .withArgs(0, 10);
  // });

});

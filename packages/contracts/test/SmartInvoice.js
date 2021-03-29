const { expect } = require('chai');
const { ethers, waffle } = require('hardhat');

const { deployMockContract } = waffle;
const { sleep } = require('./utils');
const IERC20 = require('../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json');
// const { Contract, BigNumber } = require("ethers");

const EMPTY_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
// const WETH_XDAI = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d";
// const WETH_RINKEBY = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
const resolverType = 0;
const amounts = [10, 10];
const total = amounts.reduce((t, v) => t + v, 0);
const terminationTime =
  parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;
const resolutionRate = 20;
const details = EMPTY_BYTES32;

describe('SmartInvoice', function() {
  let SmartInvoice;
  let invoice;
  let mockToken;
  let anotherMockToken;
  let client;
  let provider;
  let resolver;

  beforeEach(async function() {
    [client, provider, resolver] = await ethers.getSigners();
    mockToken = await deployMockContract(client, IERC20.abi);
    anotherMockToken = await deployMockContract(client, IERC20.abi);

    SmartInvoice = await ethers.getContractFactory('SmartInvoice');
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

  it('Should deploy a SmartInvoice', async function() {
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

  it('Should revert deploy if terminationTime has ended', async () => {
    receipt = SmartInvoice.deploy(
      client.address,
      provider.address,
      resolverType,
      resolver.address,
      mockToken.address,
      amounts,
      parseInt(new Date().getTime() / 1000, 10) + 1,
      resolutionRate,
      details,
    );
    await expect(receipt).to.revertedWith('duration ended');
  });

  it('Should revert deploy if terminationTime too long', async () => {
    receipt = SmartInvoice.deploy(
      client.address,
      provider.address,
      resolverType,
      resolver.address,
      mockToken.address,
      amounts,
      parseInt(new Date().getTime() / 1000, 10) + 5 * 365 * 24 * 3600,
      resolutionRate,
      details,
    );
    await expect(receipt).to.revertedWith('duration too long');
  });

  it('Should revert deploy if resolutionRate is 0', async () => {
    receipt = SmartInvoice.deploy(
      client.address,
      provider.address,
      resolverType,
      resolver.address,
      mockToken.address,
      amounts,
      parseInt(new Date().getTime() / 1000, 10) +  365 * 24 * 3600,
      0,
      details,
    );
    await expect(receipt).to.revertedWith('invalid resolutionRate');
  });

    it('Should revert deploy if resolverType > 1', async () => {
    receipt = SmartInvoice.deploy(
      client.address,
      provider.address,
      2,
      resolver.address,
      mockToken.address,
      amounts,
      parseInt(new Date().getTime() / 1000, 10) +  365 * 24 * 3600,
      resolutionRate,
      details,
    );
    await expect(receipt).to.revertedWith('invalid resolverType');
  });

  it('Should revert on release by non client', async function() {
    invoice = await invoice.connect(provider);
    await expect(invoice['release()']()).to.be.revertedWith('!client');
  });

  it('Should revert on release with low balance', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(5);
    await expect(invoice['release()']()).to.be.revertedWith(
      'insufficient balance',
    );
  });

  it('Should release', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    const receipt = await invoice['release()']();
    expect(await invoice['released()']()).to.equal(10);
    expect(await invoice['milestone()']()).to.equal(1);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
  });

  it('Should release full balance at last milestone', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice['release()']();
    expect(await invoice['released()']()).to.equal(10);
    expect(await invoice['milestone()']()).to.equal(1);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(15);
    await mockToken.mock.transfer.withArgs(provider.address, 15).returns(true);
    receipt = await invoice['release()']();
    expect(await invoice['released()']()).to.equal(25);
    expect(await invoice['milestone()']()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(1, 15);
  });

  it('Should release full balance after all milestones are completed', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice['release()']();
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(15);
    await mockToken.mock.transfer.withArgs(provider.address, 15).returns(true);
    receipt = await invoice['release()']();
    expect(await invoice['released()']()).to.equal(25);
    expect(await invoice['milestone()']()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(1, 15);

    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(20);
    await mockToken.mock.transfer.withArgs(provider.address, 20).returns(true);
    receipt = await invoice['release()']();
    expect(await invoice['released()']()).to.equal(45);
    expect(await invoice['milestone()']()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(2, 20);
  });

  it('Should revert if 0 balance after all milestones are completed', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice['release()']();
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(15);
    await mockToken.mock.transfer.withArgs(provider.address, 15).returns(true);
    receipt = await invoice['release()']();
    expect(await invoice['released()']()).to.equal(25);
    expect(await invoice['milestone()']()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(1, 15);

    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(0);
    await expect(invoice['release()']()).to.be.revertedWith('balance is 0');
  });

  it('Should release with milestone number', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    const receipt = await invoice['release(uint256)'](0);
    expect(await invoice['released()']()).to.equal(10);
    expect(await invoice['milestone()']()).to.equal(1);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
  });

  it('Should release with higher milestone number', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(20);
    await mockToken.mock.transfer.withArgs(provider.address, 20).returns(true);
    const receipt = await invoice['release(uint256)'](1);
    expect(await invoice['released()']()).to.equal(20);
    expect(await invoice['milestone()']()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(1, 10);
  });

  it('Should release all with higher milestone number', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(25);
    await mockToken.mock.transfer.withArgs(provider.address, 25).returns(true);
    const receipt = await invoice['release(uint256)'](1);
    expect(await invoice['released()']()).to.equal(25);
    expect(await invoice['milestone()']()).to.equal(2);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(1, 15);
  });

  it('Should revert release with higher milestone number', async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    receipt = invoice['release(uint256)'](1);
    await expect(receipt).to.revertedWith('insufficient balance');
  });

  it('Should revert release with invalid milestone number', async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    receipt = invoice['release(uint256)'](5);
    await expect(receipt).to.revertedWith('invalid milestone');
  });

  it('Should revert release with passed milestone number', async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    receipt = await invoice['release()']();
    receipt = invoice['release(uint256)'](0);
    await expect(receipt).to.revertedWith('milestone passed');
  });

  it('Should revert release with passed milestone number', async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    invoice = await invoice.connect(provider);
    receipt = invoice['release(uint256)'](0);
    await expect(receipt).to.revertedWith('!client');
  });

  it('Should releaseTokens with passed token', async () => {
    await anotherMockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await anotherMockToken.mock.transfer
      .withArgs(provider.address, 10)
      .returns(true);
    receipt = await invoice['releaseTokens(address)'](anotherMockToken.address);
    // await expect(receipt).to.revertedWith('!client');
  });

  it('Should call release if releaseTokens with invoice token', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    receipt = await invoice['releaseTokens(address)'](mockToken.address);
    expect(await invoice['released()']()).to.equal(10);
    expect(await invoice['milestone()']()).to.equal(1);
    expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
  });

  it('Should revert release with passed milestone number', async () => {
    invoice = await invoice.connect(provider);
    receipt = invoice['releaseTokens(address)'](anotherMockToken.address);
    await expect(receipt).to.revertedWith('!client');
  });

  it('Should revert withdraw before terminationTime', async () => {
    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      resolverType,
      resolver.address,
      mockToken.address,
      amounts,
      parseInt(new Date().getTime() / 1000, 10) + 300,
      resolutionRate,
      details,
    );
    await invoice.deployed();

    receipt = invoice['withdraw()']();
    await expect(receipt).to.revertedWith('!terminated');
  });

  // it('Should withdraw after terminationTime', async () => {
  //   await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
  //   await mockToken.mock.transfer.withArgs(client.address, 10).returns(true);
  //   invoice = await SmartInvoice.deploy(
  //     client.address,
  //     provider.address,
  //     resolverType,
  //     resolver.address,
  //     mockToken.address,
  //     amounts,
  //     parseInt(new Date().getTime() / 1000, 10) + 300,
  //     resolutionRate,
  //     details,
  //   );
  //   await invoice.deployed();
  //   await sleep(30);

  //   receipt = await invoice['withdraw()']();
  //   expect(await invoice['milestone()']()).to.equal(2);
  // });
});

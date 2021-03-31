const { expect } = require('chai');
const { ethers, waffle } = require('hardhat');

const { deployMockContract, provider: waffleProvider } = waffle;
const { currentTimestamp, getLockedInvoice } = require('./utils');
const IERC20 = require('../build/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json');
// const IArbitrator = require('../build/contracts/IArbitrator.sol/IArbitrator.json');
// const { Contract, BigNumber } = require("ethers");

const EMPTY_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
// const WETH_XDAI = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d";
// const WETH_RINKEBY = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
const individualResolverType = 0;
const arbitratorResolverType = 1;
const amounts = [10, 10];
const total = amounts.reduce((t, v) => t + v, 0);
const terminationTime =
  parseInt(new Date().getTime() / 1000, 10) + 30 * 24 * 60 * 60;
const resolutionRate = 20;
const details = EMPTY_BYTES32;
const numRulingOptions = 5;
const disputeId = 903;

describe('SmartInvoice', function() {
  let SmartInvoice;
  let invoice;
  let mockToken;
  let anotherMockToken;
  let mockArbitrator;
  let client;
  let provider;
  let resolver;

  beforeEach(async function() {
    [client, provider, resolver] = await ethers.getSigners();
    mockToken = await deployMockContract(client, IERC20.abi);
    anotherMockToken = await deployMockContract(client, IERC20.abi);
    // mockArbitrator = await deployMockContract(client, IArbitrator.abi);
    // console.log({mockArbitrator});

    SmartInvoice = await ethers.getContractFactory('SmartInvoice');
    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
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
    expect(await invoice['provider()']()).to.equal(provider.address);
    expect(await invoice.resolverType()).to.equal(individualResolverType);
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
    const currentTime = await currentTimestamp();
    let receipt = SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime - 3600,
      resolutionRate,
      details,
    );
    await expect(receipt).to.revertedWith('duration ended');
  });

  it('Should revert deploy if terminationTime too long', async () => {
    const currentTime = await currentTimestamp();
    let receipt = SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 5 * 365 * 24 * 3600,
      resolutionRate,
      details,
    );
    await expect(receipt).to.revertedWith('duration too long');
  });

  it('Should revert deploy if resolutionRate is 0', async () => {
    const currentTime = await currentTimestamp();
    let receipt = SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 365 * 24 * 3600,
      0,
      details,
    );
    await expect(receipt).to.revertedWith('invalid resolutionRate');
  });

  it('Should revert deploy if resolverType > 1', async () => {
    const currentTime = await currentTimestamp();
    let receipt = SmartInvoice.deploy(
      client.address,
      provider.address,
      2,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 365 * 24 * 3600,
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

  it('Should revert release if 0 balance after all milestones are completed', async function() {
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

  it('Should revert release if locked', async () => {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      details,
    );
    expect(lockedInvoice['release()']()).to.be.revertedWith('locked');
  });

  it('Should release with milestone number', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    const receipt = await invoice['release(uint256)'](0);
    expect(await invoice['released()']()).to.equal(10);
    expect(await invoice['milestone()']()).to.equal(1);
    await expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
  });

  it('Should release with higher milestone number', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(20);
    await mockToken.mock.transfer.withArgs(provider.address, 20).returns(true);
    const receipt = await invoice['release(uint256)'](1);
    expect(await invoice['released()']()).to.equal(20);
    expect(await invoice['milestone()']()).to.equal(2);
    await expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
    await expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(1, 10);
  });

  it('Should release all with higher milestone number', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(25);
    await mockToken.mock.transfer.withArgs(provider.address, 25).returns(true);
    const receipt = await invoice['release(uint256)'](1);
    expect(await invoice['released()']()).to.equal(25);
    expect(await invoice['milestone()']()).to.equal(2);
    await expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
    await expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(1, 15);
  });

  it('Should revert release with higher milestone number', async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = invoice['release(uint256)'](1);
    await expect(receipt).to.revertedWith('insufficient balance');
  });

  it('Should revert release with invalid milestone number', async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = invoice['release(uint256)'](5);
    await expect(receipt).to.revertedWith('invalid milestone');
  });

  it('Should revert release with passed milestone number', async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    await invoice['release()']();
    let receipt = invoice['release(uint256)'](0);
    await expect(receipt).to.revertedWith('milestone passed');
  });

  it('Should revert release with passed milestone number', async () => {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    invoice = await invoice.connect(provider);
    let receipt = invoice['release(uint256)'](0);
    await expect(receipt).to.revertedWith('!client');
  });

  it('Should revert release if locked', async () => {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      details,
    );
    await expect(lockedInvoice['release(uint256)'](0)).to.be.revertedWith(
      'locked',
    );
  });

  it('Should releaseTokens with passed token', async () => {
    await anotherMockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await anotherMockToken.mock.transfer
      .withArgs(provider.address, 10)
      .returns(true);
    await invoice['releaseTokens(address)'](anotherMockToken.address);
  });

  it('Should call release if releaseTokens with invoice token', async function() {
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(provider.address, 10).returns(true);
    let receipt = await invoice['releaseTokens(address)'](mockToken.address);
    expect(await invoice['released()']()).to.equal(10);
    expect(await invoice['milestone()']()).to.equal(1);
    await expect(receipt)
      .to.emit(invoice, 'Release')
      .withArgs(0, 10);
  });

  it('Should revert release if not client', async () => {
    invoice = await invoice.connect(provider);
    let receipt = invoice['releaseTokens(address)'](anotherMockToken.address);
    await expect(receipt).to.revertedWith('!client');
  });

  it('Should revert withdraw before terminationTime', async () => {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 3600,
      resolutionRate,
      details,
    );
    await invoice.deployed();

    let receipt = invoice['withdraw()']();
    await expect(receipt).to.revertedWith('!terminated');
  });

  it('Should revert withdraw if locked', async () => {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      details,
    );
    await expect(lockedInvoice['withdraw()']()).to.be.revertedWith('locked');
  });

  it('Should withdraw after terminationTime', async () => {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      details,
    );
    await invoice.deployed();
    await waffleProvider.send('evm_setNextBlockTimestamp', [
      currentTime + 1000,
    ]);
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(client.address, 10).returns(true);

    let receipt = await invoice['withdraw()']();
    expect(await invoice['milestone()']()).to.equal(2);
    await expect(receipt)
      .to.emit(invoice, 'Withdraw')
      .withArgs(10);
  });

  it('Should revert withdraw after terminationTime if balance is 0', async () => {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      details,
    );
    await invoice.deployed();
    await waffleProvider.send('evm_setNextBlockTimestamp', [
      currentTime + 1000,
    ]);
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(0);

    let receipt = invoice['withdraw()']();
    await expect(receipt).to.be.revertedWith('balance is 0');
  });

  it('Should call withdraw from withdrawTokens', async () => {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      details,
    );
    await invoice.deployed();
    await waffleProvider.send('evm_setNextBlockTimestamp', [
      currentTime + 1000,
    ]);
    await mockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await mockToken.mock.transfer.withArgs(client.address, 10).returns(true);

    let receipt = await invoice['withdrawTokens(address)'](mockToken.address);
    expect(await invoice['milestone()']()).to.equal(2);
    await expect(receipt)
      .to.emit(invoice, 'Withdraw')
      .withArgs(10);
  });

  it('Should withdrawTokens for anotherToken', async () => {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      details,
    );
    await invoice.deployed();
    await waffleProvider.send('evm_setNextBlockTimestamp', [
      currentTime + 1000,
    ]);
    await anotherMockToken.mock.balanceOf.withArgs(invoice.address).returns(10);
    await anotherMockToken.mock.transfer
      .withArgs(client.address, 10)
      .returns(true);

    await invoice['withdrawTokens(address)'](anotherMockToken.address);
    expect(await invoice['milestone()']()).to.equal(0);
  });

  it('Should revert withdrawTokens for anotherToken if not terminated', async () => {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      details,
    );
    await invoice.deployed();

    let receipt = invoice['withdrawTokens(address)'](anotherMockToken.address);
    await expect(receipt).to.be.revertedWith('!terminated');
  });

  it('Should revert withdrawTokens for anotherToken if balance is 0', async () => {
    const currentTime = await currentTimestamp();
    invoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      details,
    );
    await invoice.deployed();
    await waffleProvider.send('evm_setNextBlockTimestamp', [
      currentTime + 1000,
    ]);

    await anotherMockToken.mock.balanceOf.withArgs(invoice.address).returns(0);
    let receipt = invoice['withdrawTokens(address)'](anotherMockToken.address);
    await expect(receipt).to.be.revertedWith('balance is 0');
  });

  it('Should revert lock if terminated', async () => {
    const currentTime = await currentTimestamp();
    const newInvoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      details,
    );
    await newInvoice.deployed();
    await waffleProvider.send('evm_setNextBlockTimestamp', [
      currentTime + 1000,
    ]);

    await mockToken.mock.balanceOf.withArgs(newInvoice.address).returns(10);
    let receipt = newInvoice['lock(bytes32)'](EMPTY_BYTES32);
    await expect(receipt).to.be.revertedWith('terminated');
  });

  it('Should revert lock if balance is 0', async () => {
    const currentTime = await currentTimestamp();
    const newInvoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      details,
    );
    await newInvoice.deployed();
    await mockToken.mock.balanceOf.withArgs(newInvoice.address).returns(0);
    let receipt = newInvoice['lock(bytes32)'](EMPTY_BYTES32);
    await expect(receipt).to.be.revertedWith('balance is 0');
  });

  it('Should revert lock if not client or provider', async () => {
    const currentTime = await currentTimestamp();
    const newInvoice = await SmartInvoice.deploy(
      client.address,
      provider.address,
      individualResolverType,
      resolver.address,
      mockToken.address,
      amounts,
      currentTime + 1000,
      resolutionRate,
      details,
    );
    await newInvoice.deployed();
    await mockToken.mock.balanceOf.withArgs(newInvoice.address).returns(10);
    const newInvoiceWithResolver = await newInvoice.connect(resolver);
    let receipt = newInvoiceWithResolver['lock(bytes32)'](EMPTY_BYTES32);
    await expect(receipt).to.be.revertedWith('!party');
  });

  it('Should lock if balance is greater than 0', async () => {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      details,
    );
    expect(await lockedInvoice['locked()']()).to.equal(true);
  });

  it('Should revert resolve if not locked', async () => {
    await expect(
      invoice['resolve(uint256,uint256,bytes32)'](0, 10, EMPTY_BYTES32),
    ).to.be.revertedWith('!locked');
  });

  it('Should revert resolve if balance is 0', async () => {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      details,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(0);
    await expect(
      lockedInvoice['resolve(uint256,uint256,bytes32)'](0, 10, EMPTY_BYTES32),
    ).to.be.revertedWith('balance is 0');
  });

  it('Should revert resolve if not resolver', async () => {
    const lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      details,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(10);
    await expect(
      lockedInvoice['resolve(uint256,uint256,bytes32)'](0, 10, EMPTY_BYTES32),
    ).to.be.revertedWith('!resolver');
  });

  it('Should revert resolve if awards do not add up', async () => {
    let lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      details,
    );
    lockedInvoice = await lockedInvoice.connect(resolver);
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(10);
    await expect(
      lockedInvoice['resolve(uint256,uint256,bytes32)'](0, 0, EMPTY_BYTES32),
    ).to.be.revertedWith('resolution != remainder');
  });

  it('Should resolve with correct rewards', async () => {
    let lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      details,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(client.address, 5).returns(true);
    await mockToken.mock.transfer.withArgs(provider.address, 90).returns(true);
    await mockToken.mock.transfer.withArgs(resolver.address, 5).returns(true);
    lockedInvoice = await lockedInvoice.connect(resolver);
    let receipt = lockedInvoice['resolve(uint256,uint256,bytes32)'](
      5,
      90,
      EMPTY_BYTES32,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, 'Resolve')
      .withArgs(resolver.address, 5, 90, 5, EMPTY_BYTES32);
    expect(await lockedInvoice['released()']()).to.be.equal(0);
    expect(await lockedInvoice['milestone()']()).to.be.equal(2);
    expect(await lockedInvoice['locked()']()).to.be.equal(false);
  });

  it('Should resolve and not transfer if 0', async () => {
    let lockedInvoice = await getLockedInvoice(
      SmartInvoice,
      client,
      provider,
      individualResolverType,
      resolver,
      mockToken,
      amounts,
      resolutionRate,
      details,
    );
    await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(100);
    await mockToken.mock.transfer.withArgs(provider.address, 95).returns(true);
    await mockToken.mock.transfer.withArgs(resolver.address, 5).returns(true);
    lockedInvoice = await lockedInvoice.connect(resolver);
    let receipt = lockedInvoice['resolve(uint256,uint256,bytes32)'](
      0,
      95,
      EMPTY_BYTES32,
    );
    await expect(receipt)
      .to.emit(lockedInvoice, 'Resolve')
      .withArgs(resolver.address, 0, 95, 5, EMPTY_BYTES32);
    expect(await lockedInvoice['released()']()).to.be.equal(0);
    expect(await lockedInvoice['milestone()']()).to.be.equal(2);
    expect(await lockedInvoice['locked()']()).to.be.equal(false);
  });

  it('Should revert rule if disputeId is not initialized', async () => {
    await expect(
      invoice['rule(uint256,uint256)'](disputeId, 6),
    ).to.be.revertedWith('incorrect disputeId');
  });

  // it('Should revert rule if invalid ruling', async () => {
  //   await mockArbitrator.mock.createDispute
  //     .withArgs(numRulingOptions, details)
  //     .returns(disputeId);
  //   let lockedInvoice = await getLockedInvoice(
  //     SmartInvoice,
  //     client,
  //     provider,
  //     arbitratorResolverType,
  //     mockArbitrator,
  //     mockToken,
  //     amounts,
  //     resolutionRate,
  //     details,
  //   );
  //   expect(await lockedInvoice['resolverType()']()).to.be.equal(
  //     arbitratorResolverType,
  //   );
  //   expect(await lockedInvoice['disputeId()']()).to.be.equal(disputeId);
  //   lockedInvoice = await lockedInvoice.connect(mockArbitrator);
  //   await mockToken.mock.balanceOf.withArgs(lockedInvoice.address).returns(10);
  //   await expect(
  //     invoice['rule(uint256,uint256)'](disputeId, 6),
  //   ).to.be.revertedWith('invalid ruling');
  // });
});

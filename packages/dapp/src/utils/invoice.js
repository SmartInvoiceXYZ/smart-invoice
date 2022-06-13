import { Contract, utils } from 'ethers';

import { getInvoiceFactoryAddress, logError } from './helpers';

export const register = async (
  chainId,
  ethersProvider,
  client,
  provider,
  resolver,
  token,
  amounts, // array of milestone payments in wei
  terminationTime, // time in seconds since epoch
  detailsHash, // 32 bits hex
) => {
  const abi = new utils.Interface([
    'function create(address client, address provider, uint8 resolverType, address resolver, address token, uint256[] calldata amounts, uint256 terminationTime, bytes32 details) public',
  ]);
  const contract = new Contract(
    getInvoiceFactoryAddress(chainId),
    abi,
    ethersProvider.getSigner(),
  );

  const resolverType = 0; // 0 for individual, 1 for erc-792 arbitrator
  return contract.create(
    client,
    provider,
    resolverType,
    resolver,
    token,
    amounts,
    terminationTime,
    detailsHash,
  );
};

export const getResolutionRateFromFactory = async (
  chainId,
  ethersProvider,
  resolver,
) => {
  if (!utils.isAddress(resolver)) return 20;
  try {
    const abi = new utils.Interface([
      'function resolutionRates(address resolver) public view returns (uint256)',
    ]);
    const contract = new Contract(
      getInvoiceFactoryAddress(chainId),
      abi,
      ethersProvider,
    );

    const resolutionRate = Number(await contract.resolutionRates(resolver));
    return resolutionRate > 0 ? resolutionRate : 20;
  } catch (resolutionRateError) {
    logError({ resolutionRateError });
    return 20;
  }
};

export const awaitInvoiceAddress = async (ethersProvider, tx) => {
  await tx.wait(1);
  const abi = new utils.Interface([
    'event LogNewInvoice(uint256 indexed id, address invoice, uint256[] amounts)',
  ]);
  const receipt = await ethersProvider.getTransactionReceipt(tx.hash);
  const eventFragment = abi.events[Object.keys(abi.events)[0]];
  const eventTopic = abi.getEventTopic(eventFragment);
  const event = receipt.logs.find(e => e.topics[0] === eventTopic);
  if (event) {
    const decodedLog = abi.decodeEventLog(
      eventFragment,
      event.data,
      event.topics,
    );
    return decodedLog.invoice;
  }
  return '';
};

export const release = async (ethersProvider, address) => {
  const abi = new utils.Interface(['function release() public']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.release();
};

export const withdraw = async (ethersProvider, address) => {
  const abi = new utils.Interface(['function withdraw() public']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.withdraw();
};

export const lock = async (
  ethersProvider,
  address,
  detailsHash, // 32 bits hex
) => {
  const abi = new utils.Interface(['function lock(bytes32 details) external']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.lock(detailsHash);
};

export const resolve = async (
  ethersProvider,
  address,
  clientAward,
  providerAward,
  detailsHash, // 32 bits hex
) => {
  const abi = new utils.Interface([
    'function resolve(uint256 clientAward, uint256 providerAward, bytes32 details) external',
  ]);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.resolve(clientAward, providerAward, detailsHash);
};

export const addMilestones = async (ethersProvider, address, amounts) => {
  const abi = new utils.Interface([
    'function addMilestones(uint256[] calldata _milestones) external',
  ]);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.addMilestones(amounts);
};

export const verify = async (ethersProvider, address) => {
  const abi = new utils.Interface(['function verify() external']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.verify();
};

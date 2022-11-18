import { Contract, utils } from 'ethers';

import { getInvoiceFactoryAddress, logError } from './helpers';

export const register = async (
  factoryAddress,
  ethersProvider,
  provider,
  amounts,
  data,
  type,
) => {
  const abi = new utils.Interface([
    'function create(address _recipient, uint256[] calldata _amounts, bytes _data, bytes32 _type) public',
  ]);
  const contract = new Contract(
    factoryAddress,
    abi,
    ethersProvider.getSigner(),
  );

  return contract.create(provider, amounts, data, type);
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
export const addMilestonesWithDetails = async (
  ethersProvider,
  address,
  amounts,
  details,
) => {
  const abi = new utils.Interface([
    'function addMilestones(uint256[] calldata _milestones, bytes32 _details) external',
  ]);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.addMilestones(amounts, details);
};

export const verify = async (ethersProvider, address) => {
  const abi = new utils.Interface(['function verify() external']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.verify();
};

export const unixToDateTime = unixTimestamp => {
  const milliseconds = unixTimestamp * 1000;

  const dateObject = new Date(milliseconds);

  const humanDateFormat = dateObject.toLocaleString();

  return humanDateFormat;
};

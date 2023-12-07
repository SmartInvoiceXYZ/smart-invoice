import { Contract, utils } from 'ethers';

import { getInvoiceFactoryAddress, logError } from './helpers';

export const register = async (
  factoryAddress: any,
  ethersProvider: any,
  provider: any,
  amounts: any,
  data: any,
  type: any,
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
  chainId: ChainId,
  ethersProvider: any,
  resolver: any,
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

export const awaitInvoiceAddress = async (ethersProvider: any, tx: any) => {
  await tx.wait(1);
  const abi = new utils.Interface([
    'event LogNewInvoice(uint256 indexed index, address indexed invoice, uint256[] amounts, bytes32 invoiceType, uint256 version)',
  ]);
  const receipt = await ethersProvider.getTransactionReceipt(tx.hash);
  const eventFragment = abi.events[Object.keys(abi.events)[0]];
  const eventTopic = abi.getEventTopic(eventFragment);
  const event = receipt.logs.find((e: any) => e.topics[0] === eventTopic);
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

export const release = async (ethersProvider: any, address: any) => {
  const abi = new utils.Interface(['function release() public']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.release();
};

export const withdraw = async (ethersProvider: any, address: any) => {
  const abi = new utils.Interface(['function withdraw() public']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.withdraw();
};

export const lock = async (
  ethersProvider: any,
  address: any,
  detailsHash: any, // 32 bits hex
) => {
  const abi = new utils.Interface(['function lock(bytes32 details) external']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.lock(detailsHash);
};

export const resolve = async (
  ethersProvider: any,
  address: any,
  clientAward: any,
  providerAward: any,
  detailsHash: any, // 32 bits hex
) => {
  const abi = new utils.Interface([
    'function resolve(uint256 clientAward, uint256 providerAward, bytes32 details) external',
  ]);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.resolve(clientAward, providerAward, detailsHash);
};

export const addMilestones = async (ethersProvider: any, address: any, amounts: any) => {
  const abi = new utils.Interface([
    'function addMilestones(uint256[] calldata _milestones) external',
  ]);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.addMilestones(amounts);
};
export const addMilestonesWithDetails = async (
  ethersProvider: any,
  address: any,
  amounts: any,
  details: any,
) => {
  const abi = new utils.Interface([
    'function addMilestones(uint256[] calldata _milestones, bytes32 _details) external',
  ]);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.addMilestones(amounts, details);
};

export const verify = async (ethersProvider: any, address: any) => {
  const abi = new utils.Interface(['function verify() external']);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.verify();
};

export const unixToDateTime = (unixTimestamp: any) => {
  const milliseconds = unixTimestamp * 1000;

  const dateObject = new Date(milliseconds);

  const humanDateFormat = dateObject.toLocaleString();

  return humanDateFormat;
};

// Functions for Instant type
export const getTotalDue = async (ethersProvider: any, address: any) => {
  const abi = new utils.Interface([
    'function getTotalDue() public view returns(uint256)',
  ]);
  const contract = new Contract(address, abi, ethersProvider);
  return contract.getTotalDue();
};

export const getTotalFulfilled = async (ethersProvider: any, address: any) => {
  const abi = new utils.Interface([
    'function totalFulfilled() public view returns(uint256)',
    'function fulfilled() public view returns (bool)',
  ]);
  const contract = new Contract(address, abi, ethersProvider);
  return {
    amount: await contract.totalFulfilled(),
    isFulfilled: await contract.fulfilled(),
  };
};

export const getDeadline = async (ethersProvider: any, address: any) => {
  const abi = new utils.Interface([
    'function deadline() public view returns(uint256)',
  ]);
  const contract = new Contract(address, abi, ethersProvider);
  return contract.deadline();
};

export const getLateFee = async (ethersProvider: any, address: any) => {
  const abi = new utils.Interface([
    'function lateFee() public view returns(uint256)',
    'function lateFeeTimeInterval() public view returns (uint256)',
  ]);
  const contract = new Contract(address, abi, ethersProvider);
  return {
    amount: await contract.lateFee(),
    timeInterval: await contract.lateFeeTimeInterval(),
  };
};

export const depositTokens = async (
  ethersProvider: any,
  address: any,
  tokenAddress: any,
  amount: any,
) => {
  const abi = new utils.Interface([
    'function depositTokens(address _token, uint256 _amount) external',
  ]);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.depositTokens(tokenAddress, amount);
};

export const tipTokens = async (
  ethersProvider: any,
  address: any,
  tokenAddress: any,
  amount: any,
) => {
  const abi = new utils.Interface([
    'function tip(address _token, uint256 _amount) external',
  ]);
  const contract = new Contract(address, abi, ethersProvider.getSigner());
  return contract.tip(tokenAddress, amount);
};

import { Contract, utils } from 'ethers';

import { ADDRESSES } from './constants';

const { FACTORY } = ADDRESSES;

export const register = async (
  ethersProvider,
  client,
  provider,
  resolverType, // 0 for lexDao, 1 for aragon court
  resolver,
  token,
  amounts, // array of milestone payments in wei
  terminationTime, // time in seconds since epoch
  detailsHash, // 32 bits hex
) => {
  const abi = new utils.Interface([
    'function create(address client, address provider, uint8 resolverType, address resolver, address token, uint256[] calldata amounts, uint256 terminationTime, bytes32 details) public',
  ]);
  const contract = new Contract(FACTORY, abi, ethersProvider.getSigner());
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

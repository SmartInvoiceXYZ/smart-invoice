import {utils, Contract} from 'ethers';
import {smart_invoices_mono} from './Constants';

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
    'function register(address client, address provider, uint8 resolverType, address resolver, address token, uint256[] calldata amounts, uint256 terminationTime, bytes32 details) public',
  ]);
  const contract = new Contract(
    smart_invoices_mono,
    abi,
    ethersProvider.getSigner(),
  );
  return contract.register(
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

export const deposit = async (ethersProvider, iswETH, index, amount) => {
  const abi = new utils.Interface([
    'function deposit(uint256 index, uint256 amount) payable',
  ]);
  const contract = new Contract(
    smart_invoices_mono,
    abi,
    ethersProvider.getSigner(),
  );
  return contract.deposit(index, amount, {value: iswETH ? amount : 0});
};

export const release = async (ethersProvider, index) => {
  const abi = new utils.Interface(['function release(uint256 index) public']);
  const contract = new Contract(
    smart_invoices_mono,
    abi,
    ethersProvider.getSigner(),
  );
  return contract.release(index);
};

export const withdraw = async (ethersProvider, index) => {
  const abi = new utils.Interface(['function withdraw(uint256 index) public']);
  const contract = new Contract(
    smart_invoices_mono,
    abi,
    ethersProvider.getSigner(),
  );
  return contract.withdraw(index);
};

export const lock = async (
  ethersProvider,
  index,
  detailsHash, // 32 bits hex
) => {
  const abi = new utils.Interface(['function lock(uint256 index) public']);
  const contract = new Contract(
    smart_invoices_mono,
    abi,
    ethersProvider.getSigner(),
  );
  return contract.lock(index, detailsHash);
};

export const invoiceCount = async ethersProvider => {
  const abi = new utils.Interface([
    'function invoiceCount() public view returns(uint256)',
  ]);
  const contract = new Contract(smart_invoices_mono, abi, ethersProvider);
  return contract.invoiceCount();
};

import { Contract, utils } from 'ethers';

export const balanceOf = async (ethersProvider, token, address) => {
  const abi = new utils.Interface([
    'function balanceOf(address account) view returns(uint256)',
  ]);
  const contract = new Contract(token, abi, ethersProvider);
  return contract.balanceOf(address);
};

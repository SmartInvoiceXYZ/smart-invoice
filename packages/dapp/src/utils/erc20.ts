// @ts-expect-error TS(2792): Cannot find module 'ethers'. Did you mean to set t... Remove this comment to see the full error message
import { Contract, utils } from 'ethers';

export const balanceOf = async (ethersProvider: any, token: any, address: any) => {
  const abi = new utils.Interface([
    'function balanceOf(address account) view returns(uint256)',
  ]);
  const contract = new Contract(token, abi, ethersProvider);
  return contract.balanceOf(address);
};

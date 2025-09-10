import { ContractTypesMap } from 'hardhat/types';
import { Hex, hexToBigInt } from 'viem';

export const getSplitsBalanceOf = async (
  splitsWarehouse: ContractTypesMap['MockSplitsWarehouse'],
  token: Hex,
  address: Hex,
): Promise<bigint> => {
  // convert token hex to bigint
  const tokenId = hexToBigInt(token);
  return splitsWarehouse.read.balanceOf([address, tokenId]);
};

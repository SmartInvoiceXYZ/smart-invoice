import { viem } from 'hardhat';
import { Account, Hex } from 'viem';

export const setBalanceOf = async (
  token: Hex,
  address: Hex,
  amount: bigint | number,
) => {
  const tokenContract = await viem.getContractAt('MockToken', token);
  const hash = await tokenContract.write.setBalanceOf([
    address,
    BigInt(amount),
  ]);
  await (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

export const getBalanceOf = async (
  token: Hex,
  address: Hex,
): Promise<bigint> => {
  const tokenContract = await viem.getContractAt('MockToken', token);
  return tokenContract.read.balanceOf([address]);
};

export const setApproval = async (
  token: Hex,
  owner: Account,
  spender: Hex,
  amount: bigint | number,
) => {
  const tokenContract = await viem.getContractAt('MockToken', token);
  const hash = await tokenContract.write.approve([spender, BigInt(amount)], {
    account: owner,
  });
  await (await viem.getPublicClient()).waitForTransactionReceipt({ hash });
};

import { Address, Chain, WalletClient } from 'viem';

import { IERC20Abi } from '../abi';
import { readContract, writeContract } from './contracts';

export const approve = async (
  walletClient: WalletClient,
  token: Address,
  spender: Address,
  amount: bigint,
) =>
  writeContract({
    abi: IERC20Abi,
    address: token,
    walletClient,
    functionName: 'approve',
    args: [spender, amount],
  });

export const transfer = async (
  walletClient: WalletClient,
  token: Address,
  recipient: Address,
  amount: bigint,
) =>
  writeContract({
    abi: IERC20Abi,
    address: token,
    walletClient,
    functionName: 'transfer',
    args: [recipient, amount],
  });

export const balanceOf = async (
  chain: Chain,
  token: Address,
  address: Address,
) => {
  const [balance] = await readContract({
    abi: IERC20Abi,
    address: token,
    chain,
    functionName: 'balanceOf',
    args: [address],
  });
  return balance;
};

export const getAllowance = async (
  chain: Chain,
  token: Address,
  owner: Address,
  spender: Address,
) => {
  const [allowance] = await readContract({
    abi: IERC20Abi,
    address: token,
    chain,
    functionName: 'allowance',
    args: [owner, spender],
  });
  return allowance;
};

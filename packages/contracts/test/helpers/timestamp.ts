import { viem } from 'hardhat';

export const currentTimestamp = async (): Promise<number> => {
  const publicClient = await viem.getPublicClient();
  const block = await publicClient.getBlock();
  return Number(block.timestamp);
};

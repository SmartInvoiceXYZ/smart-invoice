import { SendDeploymentTransactionConfig } from '@nomicfoundation/hardhat-viem/types';
import { run, viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import { GetTransactionReceiptReturnType, Hex } from 'viem';

export async function verifyContract(
  chainId: number,
  address: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructorArgs: any[],
  message?: string,
): Promise<string | undefined> {
  // Don't verify on local network
  if (chainId === 31337) {
    console.log(`Skipping verification of ${address} on local network`);
    return undefined;
  }
  const result: string = await run('verify', {
    address,
    constructorArgsParams: constructorArgs,
  });

  console.log(`Verified contract at ${address} on chain ${chainId}`);

  if (message) {
    console.log(message);
  }

  return result;
}

async function getDeploymentTransactionHash(
  contractAddress: Hex,
): Promise<Hex | null> {
  const client = await viem.getPublicClient();
  // Get creation block number using binary search
  const currentBlock = await client.getBlockNumber();
  let left = currentBlock - 10n;
  if (left < 0n) {
    left = 0n;
  }
  let right = currentBlock;
  let deploymentBlock = null;

  while (left <= right) {
    const mid = left + (right - left) / 2n;

    // eslint-disable-next-line no-await-in-loop
    const code = await client.getCode({
      address: contractAddress,
      blockNumber: mid,
    });

    if (code) {
      // Contract exists at this block, check earlier
      right = mid - 1n;
      deploymentBlock = mid;
    } else {
      // Contract doesn't exist, check later blocks
      left = mid + 1n;
    }
  }

  if (!deploymentBlock) {
    return null;
  }

  // Get block with transactions
  const block = await client.getBlock({
    blockNumber: deploymentBlock,
    includeTransactions: true,
  });

  // Find contract creation transaction
  const deploymentTx = block.transactions.find(
    tx =>
      typeof tx !== 'string' &&
      tx.to === null && // Contract creation transactions have no 'to' address
      tx.input.length > 2, // Has contract bytecode
  );

  return deploymentTx?.hash ?? null;
}

type ContractName<StringT extends string> =
  StringT extends keyof ContractTypesMap ? StringT : never;

type ContractType<StringT extends string> =
  StringT extends keyof ContractTypesMap ? ContractTypesMap[StringT] : never;

export async function deployContract<CN extends string>(
  contractName: ContractName<CN>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructorArgs?: any[],
  config?: SendDeploymentTransactionConfig,
): Promise<{
  contract: ContractType<CN>;
  receipt?: GetTransactionReceiptReturnType;
}> {
  const contract = await viem.deployContract(
    contractName as never,
    constructorArgs,
    config,
  );

  const hash = await getDeploymentTransactionHash(contract.address);

  console.log(`Deployed contract ${contractName} at ${contract.address}`);
  console.log(`Deployment transaction hash: ${hash}`);

  if (!hash) {
    return {
      contract: contract as unknown as ContractType<CN>,
    };
  }

  const receipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({
    hash,
    confirmations: 5,
  });

  return { contract: contract as unknown as ContractType<CN>, receipt };
}

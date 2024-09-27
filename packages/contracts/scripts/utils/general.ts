import { SendDeploymentTransactionConfig } from '@nomicfoundation/hardhat-viem/types';
import { run, viem } from 'hardhat';
import { ContractTypesMap } from 'hardhat/types';
import { GetTransactionReceiptReturnType } from 'viem';

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
  receipt: GetTransactionReceiptReturnType;
}> {
  const { contract, deploymentTransaction } =
    await viem.sendDeploymentTransaction(
      contractName as never,
      constructorArgs,
      config,
    );

  const receipt = await (
    await viem.getPublicClient()
  ).waitForTransactionReceipt({
    hash: deploymentTransaction.hash,
  });

  return { contract: contract as unknown as ContractType<CN>, receipt };
}

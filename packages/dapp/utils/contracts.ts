import {
  AbiEvent,
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  ExtractAbiEvent,
  ExtractAbiEventNames,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import {
  Abi,
  Address,
  Chain,
  Hash,
  WalletClient,
  createPublicClient,
  getAbiItem,
  http,
  isAddress,
} from 'viem';

import { waitForTransaction } from '@wagmi/core';

export const readContract = async <
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
  TAbiFunction extends AbiFunction = ExtractAbiFunction<TAbi, TFunctionName>,
>(config: {
  abi: TAbi;
  address: Address;
  chain: Chain;
  functionName: TFunctionName | ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>;
  args: AbiParametersToPrimitiveTypes<TAbiFunction['inputs'], 'inputs'>;
}): Promise<
  AbiParametersToPrimitiveTypes<TAbiFunction['outputs'], 'outputs'>
> => {
  const { abi, address, chain, functionName, args } = config;
  const publicClient = createPublicClient({ chain, transport: http() });
  return publicClient.readContract({
    abi,
    address,
    functionName,
    args,
  } as any) as AbiParametersToPrimitiveTypes<
    TAbiFunction['outputs'],
    'outputs'
  >;
};

export const readEvent = async <
  TAbi extends Abi,
  TEventName extends ExtractAbiEventNames<TAbi>,
  TAbiEvent extends AbiEvent = ExtractAbiEvent<TAbi, TEventName>,
>(config: {
  abi: TAbi;
  chainId: number;
  hash: Hash;
  name: TEventName ;
}): Promise<AbiParametersToPrimitiveTypes<TAbiEvent['inputs'], 'inputs'>> => {
  const { abi, chainId, hash, name } = config;
  const event = getAbiItem({ abi, name });
  const receipt = await waitForTransaction({chainId, hash})
  const eventLog = receipt.logs.find((log) => log.topics[0] === name);
  if (!eventLog) throw new Error('Event not found');
  return event.decodeEventLog(eventLog.data, eventLog.topics);
  return eventLogs;
};

export const writeContract = async <
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctionNames<TAbi, 'nonpayable' | 'payable'>,
  TAbiFunction extends AbiFunction = ExtractAbiFunction<TAbi, TFunctionName>,
>(config: {
  abi: TAbi;
  address: Address;
  walletClient: WalletClient;
  functionName:
    | TFunctionName
    | ExtractAbiFunctionNames<TAbi, 'nonpayable' | 'payable'>;
  args: AbiParametersToPrimitiveTypes<TAbiFunction['inputs'], 'inputs'>;
}): Promise<Hash> => {
  const { abi, address, walletClient, functionName, args } = config;
  if (!walletClient.account?.address) throw new Error('Invalid account');
  if (!walletClient.chain) throw new Error('Invalid chain');
  if (!isAddress(address)) throw new Error('Invalid address');
  if (!isAddress(walletClient.account.address))
    throw new Error('Invalid wallet client');

  const publicClient = createPublicClient({
    chain: walletClient.chain,
    transport: http(),
  });

  const { request } = await publicClient.simulateContract({
    account: walletClient.account.address,
    address,
    abi,
    functionName,
    args,
  } as any);

  return walletClient.writeContract(request);
};

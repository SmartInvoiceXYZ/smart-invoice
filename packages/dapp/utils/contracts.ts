import {
  AbiFunction,
  AbiParametersToPrimitiveTypes,
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
  http,
  isAddress,
} from 'viem';

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

// export const readTxEvent = async <
//   TAbi extends Abi,
//   TEventName extends ExtractAbiEventNames<TAbi>,
//   TAbiEvent extends AbiEvent = ExtractAbiEvent<TAbi, TEventName>,
// >(config: {
//   abi: TAbi;
//   address: Address;
//   chain: Chain;
//   txHash: Hash;
//   eventName: TEventName | ExtractAbiEventNames<TAbi>;
// }): Promise<AbiParametersToPrimitiveTypes<TAbiEvent['inputs'], 'outputs'>> => {
//   const { abi, address, chain, txHash, eventName } = config;
//   const publicClient = createPublicClient({ chain, transport: http() });
//   const event = getAbiItem({ abi, name: eventName });
//   const logs = await publicClient.getLogs({
//     address,
//     event,
//     args: { from: txHash, to: txHash },
//   });
//   const eventLogs = logs.map(log => abiEvent.decodeLog(log));
//   return eventLogs;
// };

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

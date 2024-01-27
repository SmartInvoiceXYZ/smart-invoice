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
  createPublicClient,
  decodeEventLog,
  Hash,
  http,
  isAddress,
  WalletClient,
} from 'viem';
import { waitForTransaction } from 'wagmi/actions';

export const testContracts = () => undefined;

export const readContract = () => undefined;
export const readEvent = () => undefined;
export const writeContract = () => undefined;
// export const readContract = async <
//   TAbi extends Abi,
//   TFunctionName extends ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>,
//   TAbiFunction extends AbiFunction = ExtractAbiFunction<TAbi, TFunctionName>,
// >(config: {
//   abi: TAbi;
//   address: Address;
//   chain: Chain;
//   functionName: TFunctionName | ExtractAbiFunctionNames<TAbi, 'pure' | 'view'>;
//   args: AbiParametersToPrimitiveTypes<TAbiFunction['inputs'], 'inputs'>;
// }): Promise<
//   AbiParametersToPrimitiveTypes<TAbiFunction['outputs'], 'outputs'>
// > => {
//   const { abi, address, chain, functionName, args } = config;
//   const publicClient = createPublicClient({
//     chain,
//     transport: http(),
//   });

//   return publicClient.readContract({
//     abi: abi as Abi,
//     address: address as Address,
//     functionName: functionName as ExtractAbiFunctionNames<Abi, 'pure' | 'view'>,
//     args: args as any,
//   }) as AbiParametersToPrimitiveTypes<TAbiFunction['outputs'], 'outputs'>;
// };

// export const readEvent = async <
//   TAbi extends Abi,
//   TEventName extends Hex | ExtractAbiEventNames<TAbi>,
//   TAbiEvent extends AbiEvent = ExtractAbiEvent<TAbi, TEventName>,
// >(config: {
//   abi: TAbi;
//   chainId: number;
//   hash: Hash;
//   name: TEventName;
//   // ...
// }): Promise<AbiParametersToPrimitiveTypes<TAbiEvent['inputs'], 'inputs'>> => {
//   const { abi, chainId, hash, name } = config;
//   const receipt = await waitForTransaction({ chainId, hash });
//   const eventLog = receipt.logs.find(log => log.topics[0] === name);
//   if (!eventLog)
//     throw new Error(`Event ${name} not found in transaction ${hash}`);
//   const { data, topics } = eventLog;
//   return decodeEventLog({
//     abi,
//     data,
//     topics,
//   }) as AbiParametersToPrimitiveTypes<TAbiEvent['inputs'], 'inputs'>;
// };

// export const writeContract = async <
//   TAbi extends Abi,
//   TFunctionName extends ExtractAbiFunctionNames<TAbi, 'nonpayable' | 'payable'>,
//   TAbiFunction extends AbiFunction = ExtractAbiFunction<TAbi, TFunctionName>,
// >(config: {
//   abi: TAbi;
//   address: Address;
//   walletClient: WalletClient;
//   functionName:
//     | TFunctionName
//     | ExtractAbiFunctionNames<TAbi, 'nonpayable' | 'payable'>;
//   args: AbiParametersToPrimitiveTypes<TAbiFunction['inputs'], 'inputs'>;
// }): Promise<Hash> => {
//   const { abi, address, walletClient, functionName, args } = config;
//   if (!walletClient.account?.address) throw new Error('Invalid account');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');
//   if (!isAddress(walletClient.account.address))
//     throw new Error('Invalid wallet client');

//   const publicClient = createPublicClient({
//     chain: walletClient.chain,
//     transport: http(),
//   });

//   const { request } = await publicClient.simulateContract({
//     account: walletClient.account.address,
//     address,
//     abi,
//     functionName,
//     args,
//   } as any);

//   return walletClient.writeContract(request);
// };

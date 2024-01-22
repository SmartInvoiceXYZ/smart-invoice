import { Hex } from 'viem';

// // Functions for Instant type
export const getTotalDue = () => undefined;
// export const getTotalDue = async (chain: Chain, address: Address) => {
//   if (!chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');

//   const [totalDue] = await readContract({
//     abi: ISmartInvoiceInstantAbi,
//     address,
//     chain,
//     functionName: 'getTotalDue',
//     args: [],
//   });

//   return totalDue;
// };

export const getTotalFulfilled = async (chainId: number, address: Hex) =>
  undefined;
// export const getTotalFulfilled = async (chain: Chain, address: Address) => {
//   if (!chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');

//   const [amount] = await readContract({
//     abi: ISmartInvoiceInstantAbi,
//     address,
//     chain,
//     functionName: 'totalFulfilled',
//     args: [],
//   });

//   const [isFulfilled] = await readContract({
//     abi: ISmartInvoiceInstantAbi,
//     address,
//     chain,
//     functionName: 'fulfilled',
//     args: [],
//   });

//   return { amount, isFulfilled };
// };

export const getDeadline = async (chainId: number, address: Hex) => undefined;
// export const getDeadline = async (chain: Chain, address: Address) => {
//   if (!chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');

//   const [deadline] = await readContract({
//     abi: ISmartInvoiceInstantAbi,
//     address,
//     chain,
//     functionName: 'deadline',
//     args: [],
//   });

//   return deadline;
// };

export const getLateFee = () => undefined;
// export const getLateFee = async (chain: Chain, address: Address) => {
//   if (!chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');

//   const [amount] = await readContract({
//     abi: ISmartInvoiceInstantAbi,
//     address,
//     chain,
//     functionName: 'lateFee',
//     args: [],
//   });

//   const [timeInterval] = await readContract({
//     abi: ISmartInvoiceInstantAbi,
//     address,
//     chain,
//     functionName: 'lateFeeTimeInterval',
//     args: [],
//   });

//   return { amount, timeInterval };
// };

// export const depositTokens = async (
//   walletClient: WalletClient,
//   address: Address,
//   tokenAddress: Address,
//   amount: bigint,
// ) => {
//   if (!walletClient) throw new Error('Invalid wallet client');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');
//   if (!isAddress(tokenAddress)) throw new Error('Invalid token address');
//   if (amount <= 0) throw new Error('Invalid amount');

//   return writeContract({
//     abi: ISmartInvoiceInstantAbi,
//     address,
//     walletClient,
//     functionName: 'depositTokens',
//     args: [tokenAddress, amount],
//   });
// };

// export const tipTokens = async (
//   walletClient: WalletClient,
//   address: Address,
//   tokenAddress: Address,
//   amount: bigint,
// ) => {
//   if (!walletClient) throw new Error('Invalid wallet client');
//   if (!walletClient.chain) throw new Error('Invalid chain');
//   if (!isAddress(address)) throw new Error('Invalid address');
//   if (!isAddress(tokenAddress)) throw new Error('Invalid token address');
//   if (amount <= 0) throw new Error('Invalid amount');

//   return writeContract({
//     abi: ISmartInvoiceInstantAbi,
//     address,
//     walletClient,
//     functionName: 'tip',
//     args: [tokenAddress, amount],
//   });
// };

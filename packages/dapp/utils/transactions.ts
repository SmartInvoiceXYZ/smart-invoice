import { Chain, Hash, createPublicClient, http } from "viem";

export const waitForTransaction = async (chain: Chain, txHash: Hash) => {
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });
}
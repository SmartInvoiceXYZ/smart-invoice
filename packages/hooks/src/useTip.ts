import { SMART_INVOICE_INSTANT_ABI } from '@smartinvoicexyz/constants';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { useCallback } from 'react';
import { Hex, TransactionReceipt, zeroAddress } from 'viem';
import { usePublicClient, useSimulateContract, useWriteContract } from 'wagmi';

export const useTip = ({
  address,
  token,
  amount,
  chainId,
  onTxSuccess,
  toast,
}: TipProps) => {
  const { data } = useSimulateContract({
    address,
    chainId,
    abi: SMART_INVOICE_INSTANT_ABI,
    functionName: 'tip',
    args: [token || zeroAddress, amount || BigInt(0)],
    query: {
      enabled: !!address && !!chainId && !!token && !!amount,
    },
  });
  const publicClient = usePublicClient();

  const { writeContractAsync } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        // eslint-disable-next-line no-console
        console.log('Tip successful');
        const receipt = await publicClient?.waitForTransactionReceipt({
          hash,
        });

        if (!receipt) return;

        onTxSuccess?.(receipt);
      },
      onError: error => errorToastHandler('useTip', error, toast),
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      errorToastHandler('useTip', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return { writeAsync };
};

interface TipProps {
  chainId: number | undefined;
  address: Hex | undefined;
  token: Hex | undefined;
  amount: bigint | undefined;
  onTxSuccess?: (data: TransactionReceipt) => void;
  toast: UseToastReturn;
}

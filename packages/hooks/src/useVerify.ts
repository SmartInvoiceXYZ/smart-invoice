import {
  SMART_INVOICE_UPDATABLE_ABI,
  TOASTS,
} from '@smartinvoicexyz/constants';
import { waitForSubgraphSync } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from './types';
import { useCallback, useState } from 'react';
import { Hex } from 'viem';
import { usePublicClient, useSimulateContract, useWriteContract } from 'wagmi';

export const useVerify = ({
  address,
  chainId,
  toast,
  onTxSuccess,
}: {
  address: Hex | undefined;
  chainId: number;
  toast: UseToastReturn;
  onTxSuccess?: () => void;
}): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const publicClient = usePublicClient();
  const {
    data,
    error: prepareError,
    isLoading: prepareLoading,
  } = useSimulateContract({
    address,
    chainId,
    abi: SMART_INVOICE_UPDATABLE_ABI,
    functionName: 'verify', // no args
    query: {
      enabled: !!address,
    },
  });

  const [waitingForTx, setWaitingForTx] = useState(false);

  const {
    writeContractAsync,
    error: writeError,
    isPending: isLoading,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        setWaitingForTx(true);
        toast.info(TOASTS.useVerify.waitingForTx);
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        toast.info(TOASTS.useVerify.waitingForIndex);
        if (receipt && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, receipt.blockNumber);
        }
        setWaitingForTx(false);

        onTxSuccess?.();
      },
      onError: error => errorToastHandler('useVerify', error, toast),
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      errorToastHandler('useVerify', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return {
    writeAsync,
    prepareError,
    writeError,
    isLoading: prepareLoading || isLoading || waitingForTx,
  };
};

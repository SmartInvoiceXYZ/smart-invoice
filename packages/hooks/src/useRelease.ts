import { SMART_INVOICE_ESCROW_ABI, TOASTS } from '@smartinvoicexyz/constants';
import { InvoiceDetails, waitForSubgraphSync } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from '@wagmi/core';
import _ from 'lodash';
import { useCallback } from 'react';
import { Hex } from 'viem';
import {
  useChainId,
  usePublicClient,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

export const useRelease = ({
  invoice,
  milestone,
  onTxSuccess,
  toast,
}: {
  invoice: Partial<InvoiceDetails>;
  milestone?: number;
  onTxSuccess: () => void;
  toast: UseToastReturn;
}): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const specifiedMilestone = _.isNumber(milestone);

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    chainId,
    address: invoice?.address as Hex,
    abi: SMART_INVOICE_ESCROW_ABI,
    functionName: 'release', // specifyMilestones ? 'release(uint256)' : 'release',
    args: specifiedMilestone ? [BigInt(milestone)] : undefined, // optional args
    query: {
      enabled: !!invoice?.address,
    },
  });

  const {
    writeContractAsync,
    isPending: writeLoading,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        toast.info(TOASTS.useRelease.waitingForTx);
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        toast.info(TOASTS.useRelease.waitingForIndex);
        if (receipt && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, receipt.blockNumber);
        }

        onTxSuccess?.();
      },
      onError: (error: Error) => errorToastHandler('useRelease', error, toast),
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      errorToastHandler('useRelease', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};

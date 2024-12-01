import {
  SMART_INVOICE_UPDATABLE_ABI,
  TOASTS,
} from '@smartinvoicexyz/constants';
import { waitForSubgraphSync } from '@smartinvoicexyz/graphql';
import { InvoiceDetails, UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useCallback, useState } from 'react';
import { Hex } from 'viem';
import { usePublicClient, useSimulateContract, useWriteContract } from 'wagmi';

import { SimulateContractErrorType, WriteContractErrorType } from './types';

export const useWithdraw = ({
  invoice,
  onTxSuccess,
  toast,
}: {
  invoice: Partial<InvoiceDetails>;
  onTxSuccess: () => void;
  toast: UseToastReturn;
}): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const publicClient = usePublicClient();
  const { address } = _.pick(invoice, ['address']);

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    address: address as Hex,
    functionName: 'withdraw',
    abi: SMART_INVOICE_UPDATABLE_ABI,
    args: [],
    query: {
      enabled: !!address,
    },
  });

  const [waitingForTx, setWaitingForTx] = useState(false);

  const {
    writeContractAsync,
    isPending: writeLoading,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        setWaitingForTx(true);
        toast.info(TOASTS.useWithdraw.waitingForTx);
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        toast.info(TOASTS.useWithdraw.waitingForIndex);
        if (receipt && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, receipt.blockNumber);
        }

        setWaitingForTx(false);
        onTxSuccess?.();
      },
      onError: error => errorToastHandler('useWithdraw', error, toast),
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      errorToastHandler('useWithdraw', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading || waitingForTx,
    prepareError,
    writeError,
  };
};

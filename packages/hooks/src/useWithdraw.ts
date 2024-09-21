import { SMART_INVOICE_ESCROW_ABI, TOASTS } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
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

import { usePollSubgraph } from './usePollSubgraph';
import { useTokenBalance } from './useTokenMetadata';

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
  const chainId = useChainId();
  const { address } = _.pick(invoice, ['address']);
  const { token } = _.pick(invoice, ['token', 'tokenBalance']);

  const { data: networkTokenBalance } = useTokenBalance({
    address: invoice?.address as Hex,
    tokenAddress: token as Hex,
    chainId,
  });

  const waitForIndex = usePollSubgraph({
    label: 'useWithdraw',
    fetchHelper: async () => {},
    checkResult: () => networkTokenBalance !== 0n,
    interval: 2000, // 2 seconds, averaging about 20 seconds for index by subgraph
  });

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    address: address as Hex,
    functionName: 'withdraw',
    abi: SMART_INVOICE_ESCROW_ABI,
    // args: [],
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
        toast.info(TOASTS.useWithdraw.waitingForTx);
        await publicClient?.waitForTransactionReceipt({ hash });

        toast.info(TOASTS.useWithdraw.waitingForIndex);
        await waitForIndex();

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
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};

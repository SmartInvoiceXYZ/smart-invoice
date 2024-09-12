import { SMART_INVOICE_ESCROW_ABI, TOASTS } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { getBalance, waitForTransactionReceipt } from '@wagmi/core';
import _ from 'lodash';
import { useCallback } from 'react';
import { Hex } from 'viem';
import {
  useChainId,
  useConfig,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

import { usePollSubgraph } from './usePollSubgraph';

export const useWithdraw = ({
  invoice,
  onTxSuccess,
  toast,
}: {
  invoice: InvoiceDetails;
  onTxSuccess: () => void;
  toast: UseToastReturn;
}) => {
  const config = useConfig();
  const chainId = useChainId();
  const { address } = _.pick(invoice, ['address']);
  const { token } = _.pick(invoice, ['token', 'tokenBalance']);

  const waitForIndex = usePollSubgraph({
    label: 'useDeposit',
    fetchHelper: () =>
      getBalance(config, {
        address: invoice?.address as Hex,
        chainId,
        token: token as Hex,
      }),
    checkResult: b => b.value !== 0,
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
        await waitForTransactionReceipt(config, { hash, chainId });

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

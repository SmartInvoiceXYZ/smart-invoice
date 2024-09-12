import { SMART_INVOICE_ESCROW_ABI, TOASTS } from '@smartinvoicexyz/constants';
import { fetchInvoice, InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { waitForTransactionReceipt } from '@wagmi/core';
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

export const useRelease = ({
  invoice,
  milestone,
  onTxSuccess,
  toast,
}: {
  invoice: InvoiceDetails;
  milestone?: number;
  onTxSuccess: () => void;
  toast: UseToastReturn;
}) => {
  const chainId = useChainId();
  const config = useConfig();

  const specifiedMilestone = _.isNumber(milestone);

  const waitForIndex = usePollSubgraph({
    label: 'waiting for funds to be released',
    fetchHelper: () => fetchInvoice(chainId, invoice?.address as Hex),
    checkResult: updatedInvoice =>
      invoice?.released ? updatedInvoice.released > invoice.released : false,
  });

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
        await waitForTransactionReceipt(config, { hash, chainId });

        toast.info(TOASTS.useRelease.waitingForIndex);
        await waitForIndex();

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

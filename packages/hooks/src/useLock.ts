import {
  DEFAULT_CHAIN_ID,
  SMART_INVOICE_ESCROW_ABI,
  TOASTS,
} from '@smartinvoicexyz/constants';
import { fetchInvoice, InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { waitForTransactionReceipt } from '@wagmi/core';
import _ from 'lodash';
import { useCallback } from 'react';
import { Hex, zeroHash } from 'viem';
import {
  useChainId,
  useConfig,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

import { usePollSubgraph } from '.';

export const useLock = ({
  invoice,
  disputeReason,
  onTxSuccess,
  toast,
}: {
  invoice: InvoiceDetails;
  disputeReason: string;
  onTxSuccess?: () => void;
  toast: UseToastReturn;
}) => {
  const currentChainId = useChainId();
  const invoiceChainId = _.get(invoice, 'chainId') || DEFAULT_CHAIN_ID;

  const detailsHash = zeroHash;

  const config = useConfig();

  // const detailsHash = await uploadDisputeDetails({
  //   reason: disputeReason,
  //   invoice: address,
  //   amount: balance.toString(),
  // });

  const waitForIndex = usePollSubgraph({
    label: 'waiting for useLock tx',
    fetchHelper: async () =>
      fetchInvoice(invoiceChainId, _.get(invoice, 'address') as Hex),
    checkResult: result => !!result?.locked === true,
  });

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    address: invoice?.address as Hex,
    functionName: 'lock',
    abi: SMART_INVOICE_ESCROW_ABI,
    args: [detailsHash],
    query: {
      enabled:
        !!invoice?.address &&
        !!disputeReason &&
        currentChainId === invoiceChainId,
    },
  });

  const {
    writeContractAsync,
    isPending: writeLoading,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        toast.info(TOASTS.useLock.waitingForTx);
        await waitForTransactionReceipt(config, { hash });

        toast.info(TOASTS.useLock.waitingForIndex);
        await waitForIndex();

        onTxSuccess?.();
      },
      onError: error => errorToastHandler('useLock', error, toast),
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      errorToastHandler('useLock', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    writeLoading,
    prepareError,
    writeError,
  };
};

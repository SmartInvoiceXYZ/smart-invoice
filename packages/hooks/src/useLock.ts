import {
  DEFAULT_CHAIN_ID,
  SMART_INVOICE_ESCROW_ABI,
  TOASTS,
} from '@smartinvoicexyz/constants';
import {
  fetchInvoice,
  InvoiceDetails,
  waitForSubgraphSync,
} from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from '@wagmi/core';
import _ from 'lodash';
import { useCallback } from 'react';
import { Hex, zeroHash } from 'viem';
import {
  useChainId,
  usePublicClient,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

export const useLock = ({
  invoice,
  disputeReason,
  onTxSuccess,
  toast,
}: {
  invoice: Partial<InvoiceDetails>;
  disputeReason: string;
  onTxSuccess?: () => void;
  toast: UseToastReturn;
}): {
  writeAsync: () => Promise<Hex | undefined>;
  writeLoading: boolean;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const currentChainId = useChainId();
  const invoiceChainId = _.get(invoice, 'chainId') || DEFAULT_CHAIN_ID;

  const detailsHash = zeroHash;

  const publicClient = usePublicClient();

  // const detailsHash = await uploadDisputeDetails({
  //   reason: disputeReason,
  //   invoice: address,
  //   amount: balance.toString(),
  // });

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
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        toast.info(TOASTS.useLock.waitingForIndex);
        if (receipt && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, receipt.blockNumber);
        }

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

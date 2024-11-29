import {
  INVOICE_VERSION,
  SMART_INVOICE_UPDATABLE_ABI,
  TOASTS,
} from '@smartinvoicexyz/constants';
import { waitForSubgraphSync } from '@smartinvoicexyz/graphql';
import {
  BasicMetadata,
  InvoiceDetails,
  UseToastReturn,
} from '@smartinvoicexyz/types';
import {
  errorToastHandler,
  getDateString,
  uriToDocument,
} from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from './types';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Hex } from 'viem';
import {
  useChainId,
  usePublicClient,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

import { useDetailsPin } from './useDetailsPin';

export type FormLock = {
  description: string;
  document?: string;
};

export const useLock = ({
  invoice,
  localForm,
  onTxSuccess,
  toast,
}: {
  invoice: InvoiceDetails;
  localForm: UseFormReturn<FormLock>;
  onTxSuccess?: () => void;
  toast: UseToastReturn;
}): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const currentChainId = useChainId();
  const { chainId: invoiceChainId, metadata } = _.pick(invoice, [
    'chainId',
    'metadata',
  ]);

  const { description, document } = localForm.getValues();

  const publicClient = usePublicClient();

  const detailsData = useMemo(() => {
    const now = Math.floor(new Date().getTime() / 1000);
    const title = `Dispute ${metadata?.title} at ${getDateString(now)}`;
    return {
      version: INVOICE_VERSION,
      id: _.join([title, now, INVOICE_VERSION], '-'),
      title,
      description,
      documents: document ? [uriToDocument(document)] : [],
      createdAt: now,
    } as BasicMetadata;
  }, [description, document, metadata]);

  const { data: detailsHash, isLoading: detailsLoading } = useDetailsPin(
    detailsData,
    true,
  );

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    address: invoice?.address as Hex,
    functionName: 'lock',
    abi: SMART_INVOICE_UPDATABLE_ABI,
    args: [detailsHash as Hex],
    query: {
      enabled:
        !!invoice?.address &&
        !!description &&
        !!detailsHash &&
        currentChainId === invoiceChainId,
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
        toast.info(TOASTS.useLock.waitingForTx);
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        toast.info(TOASTS.useLock.waitingForIndex);
        if (receipt && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, receipt.blockNumber);
        }

        setWaitingForTx(false);
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
    isLoading: prepareLoading || writeLoading || waitingForTx || detailsLoading,
    prepareError,
    writeError,
  };
};

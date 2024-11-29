import {
  INVOICE_VERSION,
  SMART_INVOICE_UPDATABLE_ABI,
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
import { Hex, parseUnits } from 'viem';
import { usePublicClient, useSimulateContract, useWriteContract } from 'wagmi';

import { useDetailsPin } from './useDetailsPin';

export type FormResolve = {
  description: string;
  document?: string;
  clientAward: number;
  providerAward: number;
  resolverAward: number;
};

export const useResolve = ({
  invoice,
  localForm,
  onTxSuccess,
  toast,
}: {
  invoice: Partial<InvoiceDetails>;
  localForm: UseFormReturn<FormResolve>;
  onTxSuccess: () => void;
  toast: UseToastReturn;
}): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const publicClient = usePublicClient();

  const {
    document,
    description,
    clientAward: clientAwardForm,
    providerAward: providerAwardForm,
    resolverAward: resolverAwardForm,
  } = localForm.getValues();
  const { tokenBalance, address, isLocked, tokenMetadata, metadata } = _.pick(
    invoice,
    ['tokenBalance', 'tokenMetadata', 'address', 'isLocked', 'metadata'],
  );

  const detailsData = useMemo(() => {
    const now = Math.floor(new Date().getTime() / 1000);
    const title = `Resolve ${metadata?.title} at ${getDateString(now)}`;
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

  const clientAward =
    clientAwardForm && tokenMetadata?.decimals
      ? parseUnits(clientAwardForm.toString(), tokenMetadata.decimals)
      : BigInt(0);
  const providerAward =
    providerAwardForm && tokenMetadata?.decimals
      ? parseUnits(providerAwardForm.toString(), tokenMetadata.decimals)
      : BigInt(0);
  const resolverAward =
    resolverAwardForm && tokenMetadata?.decimals
      ? parseUnits(resolverAwardForm.toString(), tokenMetadata.decimals)
      : BigInt(0);

  const fullBalance =
    tokenBalance?.value === clientAward + providerAward + resolverAward;

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    address: address as Hex,
    functionName: 'resolve',
    abi: SMART_INVOICE_UPDATABLE_ABI,
    args: [clientAward, providerAward, detailsHash as Hex],
    query: {
      enabled:
        !!address &&
        fullBalance &&
        isLocked &&
        tokenBalance.value > BigInt(0) &&
        !!detailsHash &&
        !!description,
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
        const receipt = await publicClient?.waitForTransactionReceipt({
          hash,
        });

        if (!receipt) return;
        if (receipt && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, receipt.blockNumber);
        }
        setWaitingForTx(false);

        onTxSuccess?.();
      },
      onError: error => errorToastHandler('useResolve', error, toast),
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      errorToastHandler('useResolve', error as Error, toast);
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

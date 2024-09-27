import { SMART_INVOICE_ESCROW_ABI } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from '@wagmi/core';
import _ from 'lodash';
import { useCallback } from 'react';
import { Hex, TransactionReceipt, zeroHash } from 'viem';
import { usePublicClient, useSimulateContract, useWriteContract } from 'wagmi';

export const useResolve = ({
  invoice,
  awards: {
    client: clientAward,
    provider: providerAward,
    resolver: resolverAward,
  },
  comments,
  onTxSuccess,
  toast,
}: {
  invoice: Partial<InvoiceDetails>;
  awards: {
    client: bigint;
    provider: bigint;
    resolver: bigint;
  };
  comments: string;
  onTxSuccess: (tx: TransactionReceipt) => void;
  toast: UseToastReturn;
}): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const publicClient = usePublicClient();
  // TODO: fix pin

  const detailsHash = zeroHash;
  const { tokenBalance } = _.pick(invoice, ['tokenBalance']);

  const fullBalance =
    tokenBalance?.value === clientAward + providerAward + resolverAward;

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    address: invoice?.address as Hex,
    functionName: 'resolve',
    abi: SMART_INVOICE_ESCROW_ABI,
    args: [clientAward, providerAward, detailsHash],
    query: {
      enabled:
        !!invoice?.address &&
        fullBalance &&
        invoice?.isLocked &&
        tokenBalance.value > BigInt(0) &&
        !!comments,
    },
  });

  const {
    writeContractAsync,
    isPending: writeLoading,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        const receipt = await publicClient?.waitForTransactionReceipt({
          hash,
        });

        if (!receipt) return;

        onTxSuccess?.(receipt);
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
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};

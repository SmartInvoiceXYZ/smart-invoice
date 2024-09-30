import { SMART_INVOICE_ESCROW_ABI } from '@smartinvoicexyz/constants';
import { waitForSubgraphSync } from '@smartinvoicexyz/graphql';
import { InvoiceDetails, UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from '@wagmi/core';
import _ from 'lodash';
import { useCallback, useState } from 'react';
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
  const { tokenBalance, address, isLocked } = _.pick(invoice, [
    'tokenBalance',
    'address',
    'isLocked',
  ]);

  const fullBalance =
    tokenBalance?.value === clientAward + providerAward + resolverAward;

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    address: address as Hex,
    functionName: 'resolve',
    abi: SMART_INVOICE_ESCROW_ABI,
    args: [clientAward, providerAward, detailsHash],
    query: {
      enabled:
        !!address &&
        fullBalance &&
        isLocked &&
        tokenBalance.value > BigInt(0) &&
        !!comments,
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
    isLoading: prepareLoading || writeLoading || waitingForTx,
    prepareError,
    writeError,
  };
};

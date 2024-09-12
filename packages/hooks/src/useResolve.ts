import { SMART_INVOICE_ESCROW_ABI } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { waitForTransactionReceipt } from '@wagmi/core';
import _ from 'lodash';
import { useCallback } from 'react';
import { Hex, TransactionReceipt, zeroHash } from 'viem';
import {
  useChainId,
  useConfig,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

// TODO: fix pin

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
  invoice: InvoiceDetails;
  awards: {
    client: bigint;
    provider: bigint;
    resolver: bigint;
  };
  comments: string;
  onTxSuccess: (tx: TransactionReceipt) => void;
  toast: UseToastReturn;
}) => {
  const config = useConfig();
  const detailsHash = zeroHash;
  const chainId = useChainId();
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
        // invoice?.isLocked &&
        // balance.value > BigInt(0) &&
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
        const receipt = await waitForTransactionReceipt(config, {
          hash,
          chainId,
        });

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

import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types';
import { logError } from '@smart-invoice/utils';
import { Hex, TransactionReceipt } from 'viem';
import { useChainId, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

// TODO fix pin

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
  const detailsHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000';
  const chainId = useChainId();

  const fullBalance = true;
  // balance.value === clientAward + providerAward + resolverAward;

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: invoice?.address as Hex,
    functionName: 'resolve',
    abi: SMART_INVOICE_ESCROW_ABI,
    args: [clientAward, providerAward, detailsHash],
    enabled:
      !!invoice?.address &&
      fullBalance &&
      // invoice?.isLocked &&
      // balance.value > BigInt(0) &&
      !!comments,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async ({ hash }) => {
      const data = await waitForTransaction({ hash, chainId });

      onTxSuccess?.(data);
    },
    onError: error => {
      if (
        error.name === 'TransactionExecutionError' &&
        error.message.includes('User rejected the request')
      ) {
        toast.error({
          title: 'Signature rejected!',
          description: 'Please accept the transaction in your wallet',
        });
      } else {
        logError('useWithdraw', error);
        toast.error({
          title: 'Error occurred!',
          description: 'An error occurred while processing the transaction.',
        });
      }
    },
  });

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};

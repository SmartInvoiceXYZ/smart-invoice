import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants';
import { UseToastReturn } from '@smart-invoice/types';
import { logError } from '@smart-invoice/utils';
import { Hex, TransactionReceipt } from 'viem';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

export const useInvoiceVerify = ({
  address,
  chainId,
  toast,
  onTxSuccess,
}: {
  address: Hex | undefined;
  chainId: number;
  toast: UseToastReturn;
  onTxSuccess?: (data: TransactionReceipt) => void;
}) => {
  const { config, error: prepareError } = usePrepareContractWrite({
    address,
    chainId,
    abi: SMART_INVOICE_ESCROW_ABI,
    functionName: 'verify',
    // args: [],
    enabled: !!address,
  });

  const {
    writeAsync,
    error: writeError,
    isLoading,
  } = useContractWrite({
    ...config,

    onSuccess: async result => {
      const data = await waitForTransaction({ chainId, hash: result.hash });

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
        toast.error({
          title: 'Error occurred!',
          description: 'An error occurred while processing the transaction.',
        });
        logError(error);
      }
    },
  });

  return {
    writeAsync,
    prepareError,
    writeError,
    isLoading,
  };
};

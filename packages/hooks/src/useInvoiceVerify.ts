import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants/src';
import { UseToastReturn } from '@smart-invoice/types';
import { Hex } from 'viem';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

export const useInvoiceVerify = ({
  address,
  chainId,
  toast,
}: {
  address: Hex | undefined;
  chainId: number;
  toast: UseToastReturn;
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

    onSuccess: result => {
      console.log(result);
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

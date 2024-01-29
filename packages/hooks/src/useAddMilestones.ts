import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants/src';
import { UseToastReturn } from '@smart-invoice/types';
import { Hex, TransactionReceipt } from 'viem';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

export const useAddMilestones = ({
  address,
  chainId,
  toast,
  onTxSuccess,
}: AddMilestonesProps) => {
  console.log('useAddMilestones');

  const { config, error: prepareError } = usePrepareContractWrite({
    address,
    chainId,
    abi: SMART_INVOICE_ESCROW_ABI,
    functionName: 'addMilestones',
  });

  const {
    writeAsync,
    isLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async ({ hash }): Promise<void> => {
      console.log('onSuccess');
      const txData = await waitForTransaction({ hash, chainId });

      onTxSuccess?.(txData);
    },
    onError: error => {
      console.log('onError', error);
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

  return { writeAsync, isLoading, prepareError, writeError };
};

interface AddMilestonesProps {
  address: Hex;
  chainId: number;
  toast: UseToastReturn;
  onTxSuccess?: (txData: TransactionReceipt) => void;
}

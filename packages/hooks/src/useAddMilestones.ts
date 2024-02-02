import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types';
import { logError } from '@smart-invoice/utils';
import _ from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { Hex, parseUnits, TransactionReceipt } from 'viem';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

// import { useDetailsPin } from './useDetailsPin';

export const useAddMilestones = ({
  address,
  chainId,
  localForm,
  invoice,
  toast,
  onTxSuccess,
}: AddMilestonesProps) => {
  const { getValues } = localForm;
  const { milestones } = getValues();

  // const { data: details } = useDetailsPin({
  //   projectAgreement,
  //   invoice,
  // });

  const { tokenMetadata } = _.pick(invoice, ['tokenMetadata']);

  const parsedMilestones = _.map(milestones, (milestone: { value: string }) =>
    milestone.value !== '' && _.toNumber(milestone.value) > 0
      ? parseUnits(milestone.value, tokenMetadata?.decimals || 18)
      : BigInt(0),
  );

  const { config, error: prepareError } = usePrepareContractWrite({
    address,
    chainId,
    abi: SMART_INVOICE_ESCROW_ABI,
    functionName: 'addMilestones',
    args: [parsedMilestones],
    enabled: _.every(parsedMilestones, m => m > BigInt(0)),
  });

  const {
    writeAsync,
    isLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async ({ hash }): Promise<void> => {
      const txData = await waitForTransaction({ hash, chainId });

      onTxSuccess?.(txData);
    },
    onError: error => {
      // eslint-disable-next-line no-console
      logError('useAddMilestones', error);
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
  invoice?: InvoiceDetails;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localForm: UseFormReturn<any>;
  toast: UseToastReturn;
  onTxSuccess?: (txData: TransactionReceipt) => void;
}

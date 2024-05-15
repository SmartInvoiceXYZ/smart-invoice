import { SMART_INVOICE_ESCROW_ABI, TOASTS } from '@smart-invoice/constants';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types';
import { errorToastHandler } from '@smart-invoice/utils';
import _ from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { Hex, parseUnits, TransactionReceipt } from 'viem';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { fetchBalance, waitForTransaction } from 'wagmi/actions';

import { usePollSubgraph } from './usePollSubgraph';
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

  const { token, total } = _.pick(invoice, ['token', 'total']);

  const newTotal =
    _.sum(_.map(parsedMilestones, m => Number(m))) + Number(total);

  const waitForIndex = usePollSubgraph({
    label: 'useDeposit',
    fetchHelper: () =>
      fetchBalance({
        address: invoice?.address as Hex,
        chainId,
        token: token as Hex,
      }),
    checkResult: () => newTotal < Number(total),
    interval: 2000, // 2 seconds, averaging about 20 seconds for index by subgraph
  });

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
      toast.info(TOASTS.useAddMilestone.waitingForTx);
      await waitForTransaction({ hash, chainId });

      toast.info(TOASTS.useAddMilestone.waitingForIndex);
      await waitForIndex();

      onTxSuccess?.();
    },
    onError: error => errorToastHandler('useAddMilestones', error, toast),
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
  onTxSuccess?: () => void;
}

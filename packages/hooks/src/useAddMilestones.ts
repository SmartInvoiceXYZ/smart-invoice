import { SMART_INVOICE_ESCROW_ABI, TOASTS } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { getBalance, waitForTransactionReceipt } from '@wagmi/core';
import _ from 'lodash';
import { useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Hex, parseUnits } from 'viem';
import { useConfig, useSimulateContract, useWriteContract } from 'wagmi';

import { usePollSubgraph } from './usePollSubgraph';

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
  const config = useConfig();

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
      getBalance(config, {
        chainId,
        address: invoice?.address as Hex,
        token: token as Hex,
      }),
    checkResult: () => newTotal < Number(total),
    interval: 2000, // 2 seconds, averaging about 20 seconds for index by subgraph
  });

  const { error: prepareError, data } = useSimulateContract({
    address,
    chainId,
    abi: SMART_INVOICE_ESCROW_ABI,
    functionName: 'addMilestones',
    args: [parsedMilestones],
    query: {
      enabled: _.every(parsedMilestones, m => m > BigInt(0)),
    },
  });

  const {
    writeContractAsync,
    isPending: isLoading,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        toast.info(TOASTS.useAddMilestone.waitingForTx);
        await waitForTransactionReceipt(config, { hash, chainId });

        toast.info(TOASTS.useAddMilestone.waitingForIndex);
        await waitForIndex();

        onTxSuccess?.();
      },
      onError: (error: Error) =>
        errorToastHandler('useAddMilestones', error, toast),
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      errorToastHandler('useAddMilestones', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

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

import { SMART_INVOICE_ESCROW_ABI, TOASTS } from '@smartinvoicexyz/constants';
import { waitForSubgraphSync } from '@smartinvoicexyz/graphql';
import { InvoiceDetails, UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from '@wagmi/core';
import _ from 'lodash';
import { useCallback, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Hex, parseUnits } from 'viem';
import { usePublicClient, useSimulateContract, useWriteContract } from 'wagmi';

export const useAddMilestones = ({
  address,
  chainId,
  localForm,
  invoice,
  toast,
  onTxSuccess,
}: AddMilestonesProps): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const publicClient = usePublicClient();

  const { tokenMetadata } = _.pick(invoice, ['tokenMetadata', 'total']);

  const { getValues } = localForm;

  // TODO: update project agreement link
  const { milestones } = getValues();

  const parsedMilestones = _.map(milestones, (milestone: { value: string }) =>
    milestone.value !== '' && _.toNumber(milestone.value) > 0
      ? parseUnits(milestone.value, tokenMetadata?.decimals || 18)
      : BigInt(0),
  );

  const {
    error: prepareError,
    isLoading: prepareLoading,
    data,
  } = useSimulateContract({
    address,
    chainId,
    abi: SMART_INVOICE_ESCROW_ABI,
    functionName: 'addMilestones',
    args: [parsedMilestones],
    query: {
      enabled: _.every(parsedMilestones, m => m > BigInt(0)),
    },
  });

  const [waitingForTx, setWaitingForTx] = useState(false);

  const {
    writeContractAsync,
    isPending: isLoading,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        setWaitingForTx(true);
        toast.info(TOASTS.useAddMilestone.waitingForTx);
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        toast.info(TOASTS.useAddMilestone.waitingForIndex);
        if (receipt && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, receipt.blockNumber);
        }
        setWaitingForTx(false);

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

  return {
    writeAsync,
    isLoading: isLoading || waitingForTx || prepareLoading,
    prepareError,
    writeError,
  };
};

interface AddMilestonesProps {
  address: Hex;
  chainId: number;
  invoice?: Partial<InvoiceDetails>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localForm: UseFormReturn<any>;
  toast: UseToastReturn;
  onTxSuccess?: () => void;
}

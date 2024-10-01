import {
  INVOICE_VERSION,
  SMART_INVOICE_ESCROW_ABI,
  TOASTS,
} from '@smartinvoicexyz/constants';
import { waitForSubgraphSync } from '@smartinvoicexyz/graphql';
import {
  FormInvoice,
  InvoiceDetails,
  InvoiceMetadata,
  Milestone,
  UseToastReturn,
} from '@smartinvoicexyz/types';
import {
  errorToastHandler,
  getResolverInfoByAddress,
  parseToDate,
  uriToDocument,
} from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from '@wagmi/core';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Hex, parseUnits } from 'viem';
import { usePublicClient, useSimulateContract, useWriteContract } from 'wagmi';

import { useDetailsPin } from './useDetailsPin';

type AddMilestonesProps = {
  address: Hex;
  chainId: number;
  invoice?: Partial<InvoiceDetails>;
  localForm: UseFormReturn<Partial<FormInvoice>>;
  toast: UseToastReturn;
  onTxSuccess?: () => void;
};

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

  const { tokenMetadata, metadata, amounts, resolver } = _.pick(invoice, [
    'tokenMetadata',
    'metadata',
    'amounts',
    'resolver',
  ]);

  const { getValues } = localForm;

  const { milestones, document } = getValues();

  const detailsData = useMemo(() => {
    const {
      title,
      description,
      startDate,
      endDate,
      resolverType,
      klerosCourt,
      createdAt,
      documents,
      milestones: oldMilestones,
    } = metadata ?? {};

    const now = createdAt
      ? Math.floor(parseToDate(createdAt).getTime() / 1000)
      : Math.floor(new Date().getTime() / 1000);
    const end = endDate
      ? Math.floor(parseToDate(endDate).getTime() / 1000)
      : now + 60 * 60 * 24 * 30;
    const start = startDate
      ? Math.floor(parseToDate(startDate).getTime() / 1000)
      : now;

    const newMilestones: Milestone[] = [];

    amounts?.forEach((_amount, i) => {
      newMilestones.push({
        id: _.join([`Milestone ${i + 1}`, now, INVOICE_VERSION], '-'),
        title: oldMilestones?.[i].title ?? `Milestone ${i + 1}`,
        description: oldMilestones?.[i].description ?? '',
        createdAt: oldMilestones?.[i].createdAt ?? now,
        endDate: oldMilestones?.[i].endDate ?? end,
      });
    });

    milestones?.forEach((milestone, i) => {
      newMilestones.push({
        id: _.join(
          [`Milestone ${i + newMilestones.length + 1}`, now, INVOICE_VERSION],
          '-',
        ),
        title: milestone.title ?? `Milestone ${i + newMilestones.length + 1}`,
        description: milestone.description ?? '',
        createdAt: now,
        endDate: end,
      });
    });

    const newResolverType =
      resolverType ??
      getResolverInfoByAddress(address, chainId)?.id ??
      'custom';

    return {
      version: INVOICE_VERSION,
      id: _.join([title, now, INVOICE_VERSION], '-'),
      title,
      description,
      documents: documents
        ? [
            ...documents.map(d => ({
              ...uriToDocument(d.src),
              createdAt: createdAt
                ? Math.floor(parseToDate(createdAt).getTime() / 1000)
                : Math.floor(new Date().getTime() / 1000),
            })),
            uriToDocument(document),
          ]
        : [uriToDocument(document)],
      startDate: start,
      endDate: end,
      createdAt: now,
      milestones: newMilestones,
      resolverType: newResolverType,
      ...(newResolverType === 'kleros' ? { klerosCourt } : {}),
    } as InvoiceMetadata;
  }, [document, JSON.stringify(milestones), metadata, amounts, resolver]);

  console.log('detailsData', detailsData);

  const { data: details, isLoading: detailsLoading } =
    useDetailsPin(detailsData);

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
    args: [parsedMilestones, details as Hex],
    query: {
      enabled: _.every(parsedMilestones, m => m > BigInt(0)) && !!details,
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
    isLoading: isLoading || waitingForTx || prepareLoading || detailsLoading,
    prepareError,
    writeError,
  };
};

import {
  INVOICE_VERSION,
  LOG_TYPE,
  SMART_INVOICE_FACTORY_ABI,
  TOASTS,
  wrappedNativeToken,
} from '@smartinvoicexyz/constants';
import { waitForSubgraphSync } from '@smartinvoicexyz/graphql';
import {
  FormInvoice,
  InvoiceMetadata,
  UseToastReturn,
} from '@smartinvoicexyz/types';
import {
  errorToastHandler,
  getInvoiceFactoryAddress,
  parseTxLogs,
  uriToDocument,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Address, encodeAbiParameters, Hex, parseUnits, toHex } from 'viem';
import { usePublicClient, useSimulateContract, useWriteContract } from 'wagmi';

import { useDetailsPin } from './useDetailsPin';
import { useFetchTokens } from './useFetchTokens';

const INSTANT_TYPE = toHex('instant', { size: 32 });

export const useInstantCreate = ({
  invoiceForm,
  chainId,
  toast,
  onTxSuccess,
}: {
  invoiceForm: UseFormReturn<Partial<FormInvoice>>;
  chainId: number;
  toast: UseToastReturn;
  onTxSuccess?: (result: Address) => void;
}): {
  prepareError: Error | null;
  writeAsync: () => Promise<Hex | undefined>;
  writeError: Error | null;
  isLoading: boolean;
} => {
  const invoiceFactory = getInvoiceFactoryAddress(chainId);
  const [waitingForTx, setWaitingForTx] = useState(false);
  const { getValues } = invoiceForm;
  const invoiceValues = getValues();

  const {
    client,
    provider,
    token,
    title,
    description,
    document,
    startDate,
    endDate,
    deadline,
    paymentDue,
    lateFee,
    lateFeeTimeInterval,
  } = _.pick(invoiceValues, [
    'client',
    'provider',
    'token',
    'title',
    'description',
    'document',
    'startDate',
    'endDate',
    'deadline',
    'paymentDue',
    'lateFee',
    'lateFeeTimeInterval',
  ]);

  const detailsData = useMemo(() => {
    const now = Math.floor(new Date().getTime() / 1000);
    return {
      version: INVOICE_VERSION,
      id: title ?? `${now}${INVOICE_VERSION}`,
      title,
      description,
      documents: [uriToDocument(document)],
      startDate: Math.floor(new Date(startDate ?? '').getTime() / 1000),
      endDate: Math.floor(new Date(endDate ?? '').getTime() / 1000),
      createdAt: now,
    } as InvoiceMetadata;
  }, [title, description, document, startDate, endDate]);

  const { data: details } = useDetailsPin(detailsData);

  const { data: tokens } = useFetchTokens();
  const tokenMetadata = _.find(
    tokens,
    t =>
      t.address.toLowerCase() === token?.toLowerCase() && t.chainId === chainId,
  );

  const escrowData = useMemo(() => {
    if (!client || !deadline || !wrappedNativeToken(chainId) || !details) {
      return '0x';
    }
    let lateFeeTimeIntervalSeconds = BigInt(0);
    if (lateFeeTimeInterval) {
      lateFeeTimeIntervalSeconds = BigInt(
        // days to milliseconds
        Number(lateFeeTimeInterval) * 24 * 60 * 60 * 1000,
      );
    }

    const encodedParams = encodeAbiParameters(
      [
        { type: 'address' }, //     _client,
        { type: 'address' }, //     _token,
        { type: 'uint256' }, //     _deadline, // exact time when late fee kicks in
        { type: 'bytes32' }, //     _details,
        { type: 'address' }, //     _wrappedNativeToken,
        { type: 'uint256' }, //     _lateFee,
        { type: 'uint256' }, //     _lateFeeTimeInterval
      ],
      [
        client as Address,
        token as Address, // address _token (payment token address)
        BigInt(new Date(deadline).getTime() / 1000), // deadline
        details, // bytes32 _details detailHash
        wrappedNativeToken(chainId),
        parseUnits(lateFee || '0', tokenMetadata?.decimals || 18), // late fee in payment token per interval
        lateFeeTimeIntervalSeconds, // late fee time interval convert from some days duration to seconds
      ],
    );

    return encodedParams;
  }, [
    client,
    token,
    tokenMetadata,
    deadline,
    details,
    wrappedNativeToken,
    lateFee,
    lateFeeTimeInterval,
  ]);

  const paymentAmount = parseUnits(
    _.toString(paymentDue),
    tokenMetadata?.decimals ?? 18,
  );

  const {
    data,
    error: prepareError,
    isLoading: prepareLoading,
  } = useSimulateContract({
    address: invoiceFactory,
    chainId,
    abi: SMART_INVOICE_FACTORY_ABI,
    functionName: 'create',
    args: [provider as Address, [paymentAmount], escrowData, INSTANT_TYPE],
    query: {
      enabled: !!invoiceFactory && !!chainId && !!provider && !!escrowData,
    },
  });

  const publicClient = usePublicClient();

  const {
    writeContractAsync,
    error: writeError,
    isPending: isLoading,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        // wait for tx to confirm on chain
        setWaitingForTx(true);
        toast.info(TOASTS.useInvoiceCreate.waitingForTx);

        const txData = await publicClient?.waitForTransactionReceipt({
          hash,
        });

        if (!txData) return;

        // wait for subgraph to index
        const localInvoiceId = parseTxLogs(
          LOG_TYPE.Factory,
          txData,
          'LogNewInvoice',
          'invoice',
        );
        if (!localInvoiceId) return;
        toast.info(TOASTS.useInvoiceCreate.waitingForIndex);

        if (txData && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, txData.blockNumber);
        }
        setWaitingForTx(false);

        // pass back to component for further processing
        onTxSuccess?.(localInvoiceId);
      },
      onError: (error: Error) =>
        errorToastHandler('useInstantCreate', error, toast),
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      errorToastHandler('useInstantCreate', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return {
    prepareError,
    writeAsync,
    writeError,
    isLoading: isLoading || waitingForTx || prepareLoading,
  };
};

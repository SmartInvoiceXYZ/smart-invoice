import {
  INVOICE_VERSION,
  KnownResolverType,
  LOG_TYPE,
  SMART_INVOICE_FACTORY_ABI,
  TOASTS,
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
  getResolverInfo,
  getWrappedNativeToken,
  parseTxLogs,
  uriToDocument,
} from '@smartinvoicexyz/utils';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Address, encodeAbiParameters, Hex, parseUnits, toHex } from 'viem';
import {
  useChainId,
  usePublicClient,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

import { SimulateContractErrorType, WriteContractErrorType } from './types';
import { useDetailsPin } from './useDetailsPin';
import { useFetchTokens } from './useFetchTokens';
import { QUERY_KEY_INVOICES } from './useInvoices';

const ESCROW_TYPE = toHex('updatable', { size: 32 });

interface UseInvoiceCreate {
  invoiceForm: UseFormReturn<Partial<FormInvoice>>;
  toast: UseToastReturn;
  onTxSuccess?: (result: Hex) => void;
}

const REQUIRES_VERIFICATION = true;

export const useInvoiceCreate = ({
  invoiceForm,
  toast,
  onTxSuccess,
}: UseInvoiceCreate): {
  writeAsync: () => Promise<Hex | undefined>;
  isLoading: boolean;
  isProcessing: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [waitingForTx, setWaitingForTx] = useState(false);

  const queryClient = useQueryClient();

  const { getValues } = invoiceForm;
  const invoiceValues = getValues();
  const {
    client,
    provider,
    resolverType,
    klerosCourt,
    resolverAddress: customResolverAddress,
    token,
    safetyValveDate,
    milestones,
    title,
    description,
    document,
    startDate,
    endDate,
  } = _.pick(invoiceValues, [
    'client',
    'provider',
    'resolverType',
    'resolverAddress',
    'token',
    'klerosCourt',
    'safetyValveDate',
    'milestones',
    'title',
    'description',
    'document',
    'startDate',
    'endDate',
  ]);

  const { data: tokens } = useFetchTokens();
  const invoiceToken = _.find(
    tokens,
    t =>
      t.address.toLowerCase() === token?.toLowerCase() && t.chainId === chainId,
  );

  const detailsData = useMemo(() => {
    const now = Math.floor(new Date().getTime() / 1000);
    const start = startDate
      ? Math.floor(new Date(startDate).getTime() / 1000)
      : now;
    const end = endDate
      ? Math.floor(new Date(endDate).getTime() / 1000)
      : now + 60 * 60 * 24 * 30;
    return {
      version: INVOICE_VERSION,
      id: _.join([title, now, INVOICE_VERSION], '-'),
      title,
      description,
      documents: document ? [uriToDocument(document)] : [],
      startDate: start,
      endDate: end,
      createdAt: now,
      milestones:
        milestones?.map(m => ({
          id: _.join(['milestone', m.title, now, INVOICE_VERSION], '-'),
          title: m.title ?? '',
          description: m.description ?? '',
          createdAt: now,
          endDate: end,
        })) ?? [],
      resolverType,
      ...(resolverType === 'kleros' ? { klerosCourt } : {}),
    } as InvoiceMetadata;
  }, [
    title,
    description,
    document,
    startDate,
    endDate,
    resolverType,
    klerosCourt,
    JSON.stringify(milestones),
  ]);

  const { data: details, isLoading: detailsLoading } =
    useDetailsPin(detailsData);

  const resolverAddress = useMemo(() => {
    if (resolverType === 'custom') {
      return customResolverAddress;
    }
    const resolverInfo = getResolverInfo(
      resolverType as KnownResolverType,
      chainId,
    );
    return resolverInfo?.address;
  }, [resolverType, customResolverAddress]);

  const escrowData = useMemo(() => {
    const wrappedNativeToken = getWrappedNativeToken(chainId);
    const invoiceFactory = getInvoiceFactoryAddress(chainId);
    if (
      !client ||
      !resolverAddress ||
      !token ||
      !safetyValveDate ||
      !wrappedNativeToken ||
      !details ||
      !invoiceFactory ||
      !provider
    ) {
      return '0x';
    }

    return encodeAbiParameters(
      [
        { type: 'address' }, //     _client,
        { type: 'uint8' }, //     _resolverTypeType,
        { type: 'address' }, //     _resolverType,
        { type: 'address' }, //     _token,
        { type: 'uint256' }, //     _terminationTime, seconds since epoch
        { type: 'bytes32' }, //     _details,
        { type: 'address' }, //     _wrappedNativeToken,
        { type: 'bool' }, //     _requireVerification, warns the client not to deposit funds until verifying they can release or lock funds
        { type: 'address' }, //     _factory,
        { type: 'address' }, //     _providerReceiver,
      ],
      [
        client as Address,
        0, // all are individual resolvers
        resolverAddress as Address,
        token as Address, // address _token (payment token address)
        BigInt(new Date(safetyValveDate.toString()).getTime() / 1000), // safety valve date
        details, // bytes32 _details detailHash
        wrappedNativeToken,
        REQUIRES_VERIFICATION,
        invoiceFactory,
        provider as Address, // TODO: replace with providerReceiver
      ],
    );
  }, [client, resolverType, token, details, safetyValveDate, provider]);

  const amounts = _.map(milestones, m =>
    parseUnits(m.value, invoiceToken?.decimals ?? 18),
  );

  const {
    data,
    error: prepareError,
    isLoading: prepareLoading,
  } = useSimulateContract({
    address: getInvoiceFactoryAddress(chainId),
    abi: SMART_INVOICE_FACTORY_ABI,
    functionName: 'create',
    args: [provider as Address, amounts, escrowData, ESCROW_TYPE],
    query: {
      enabled: escrowData !== '0x' && !!provider && !_.isEmpty(milestones),
    },
  });

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

        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_INVOICES] });

        // pass back to component for further processing
        onTxSuccess?.(localInvoiceId);
      },
      onError: error => errorToastHandler('useInvoiceCreate', error, toast),
    },
  });

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      console.error('useInvoiceCreate', error);
      errorToastHandler('useInvoiceCreate', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return {
    writeAsync,
    prepareError,
    writeError,
    isLoading: isLoading || waitingForTx || prepareLoading || detailsLoading,
    isProcessing: waitingForTx,
  };
};

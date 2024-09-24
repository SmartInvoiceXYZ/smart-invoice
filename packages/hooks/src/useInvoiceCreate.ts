import {
  invoiceFactory,
  LOG_TYPE,
  SMART_INVOICE_FACTORY_ABI,
  TOASTS,
  wrappedNativeToken,
} from '@smartinvoicexyz/constants';
import {
  fetchInvoice,
  Invoice,
  waitForSubgraphSync,
} from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler, parseTxLogs } from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from '@wagmi/core';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { encodeAbiParameters, Hex, parseUnits, toHex } from 'viem';
import {
  useChainId,
  usePublicClient,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

import { useDetailsPin } from './useDetailsPin';
import { useFetchTokens } from './useFetchTokens';

const ESCROW_TYPE = toHex('escrow', { size: 32 });

interface UseInvoiceCreate {
  invoiceForm: UseFormReturn;
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
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [waitingForTx, setWaitingForTx] = useState(false);

  const { getValues } = invoiceForm;
  const invoiceValues = getValues();
  const {
    client,
    provider,
    resolver,
    klerosCourt,
    customResolver,
    token,
    safetyValveDate,
    milestones,
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
  } = _.pick(invoiceValues, [
    'client',
    'provider',
    'resolver',
    'customResolver',
    'token',
    'klerosCourt',
    'safetyValveDate',
    'milestones',
    'projectName',
    'projectDescription',
    'projectAgreement',
    'startDate',
    'endDate',
  ]);

  const localInvoiceFactory = invoiceFactory(chainId);

  const { data: tokens } = useFetchTokens();
  const invoiceToken = _.filter(tokens, { address: token, chainId })[0];

  const detailsData = {
    projectName,
    projectDescription,
    projectAgreement,
    ...(klerosCourt && { klerosCourt }),
    startDate,
    endDate,
  };

  const { data: details } = useDetailsPin({ ...detailsData });

  const escrowData = useMemo(() => {
    if (
      !client ||
      !(resolver || customResolver) ||
      !token ||
      !safetyValveDate ||
      !wrappedNativeToken(chainId) ||
      !details ||
      !localInvoiceFactory ||
      !provider
    ) {
      return '0x';
    }

    return encodeAbiParameters(
      [
        { type: 'address' }, //     _client,
        { type: 'uint8' }, //       _resolverType,
        { type: 'address' }, //     _resolver,
        { type: 'address' }, //     _token,
        { type: 'uint256' }, //     _terminationTime, // exact termination date in seconds since epoch
        { type: 'bytes32' }, //     _details,
        { type: 'address' }, //     _wrappedNativeToken,
        { type: 'bool' }, //        _requireVerification, // warns the client not to deposit funds until verifying they can release or lock funds
        { type: 'address' }, //     _factory,
      ],
      [
        client,
        0,
        customResolver || resolver, // address _resolver (LEX DAO resolver address)
        token, // address _token (payment token address)
        BigInt(new Date(safetyValveDate.toString()).getTime() / 1000), // safety valve date
        details, // bytes32 _details detailHash
        wrappedNativeToken(chainId),
        REQUIRES_VERIFICATION,
        localInvoiceFactory,
      ],
    );
  }, [
    client,
    resolver,
    token,
    details,
    safetyValveDate,
    wrappedNativeToken,
    localInvoiceFactory,
  ]);

  const { data, error: prepareError } = useSimulateContract({
    address: localInvoiceFactory,
    abi: SMART_INVOICE_FACTORY_ABI,
    functionName: 'create',
    args: [
      provider,
      _.map(milestones, milestone =>
        parseUnits(_.toString(milestone?.value), invoiceToken?.decimals),
      ),
      escrowData,
      ESCROW_TYPE,
    ],
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
      errorToastHandler('useInvoiceCreate', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return {
    writeAsync,
    prepareError,
    writeError,
    isLoading: isLoading || waitingForTx,
  };
};

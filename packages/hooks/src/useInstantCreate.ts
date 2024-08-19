import {
  LOG_TYPE,
  SMART_INVOICE_FACTORY_ABI,
  TOASTS,
  wrappedNativeToken,
} from '@smartinvoicexyz/constants';
import { fetchInvoice, Invoice } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import {
  errorToastHandler,
  getInvoiceFactoryAddress,
  parseTxLogs,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Address, encodeAbiParameters, Hex, parseUnits, toHex } from 'viem';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction, WriteContractResult } from 'wagmi/actions';

import { useDetailsPin } from './useDetailsPin';
import { usePollSubgraph } from './usePollSubgraph';

export const useInstantCreate = ({
  invoiceForm,
  chainId,
  toast,
  onTxSuccess,
}: {
  invoiceForm: UseFormReturn;
  chainId: number;
  toast: UseToastReturn;
  onTxSuccess?: (result: Address) => void;
}): {
  waitingForTx: boolean;
  prepareError: Error | null;
  writeAsync: (() => Promise<WriteContractResult>) | undefined;
  writeError: Error | null;
  isLoading: boolean;
} => {
  const invoiceFactory = getInvoiceFactoryAddress(chainId);
  const [waitingForTx, setWaitingForTx] = useState(false);
  const [newInvoiceId, setNewInvoiceId] = useState<Hex | undefined>();
  const { getValues } = invoiceForm;
  const invoiceValues = getValues();
  const {
    client,
    provider,
    token,
    tokenMetadata,
    projectName,
    projectDescription,
    projectAgreement,
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
    'tokenMetadata',
    'projectName',
    'projectDescription',
    'projectAgreement',
    'startDate',
    'endDate',
    'deadline',
    'paymentDue',
    'lateFee',
    'lateFeeTimeInterval',
  ]);

  const detailsData = {
    projectName,
    projectDescription,
    projectAgreement: _.get(_.first(projectAgreement), 'src', ''),
    startDate,
    endDate,
  };

  const { data: details } = useDetailsPin({ ...detailsData });

  const waitForResult = usePollSubgraph({
    label: 'Creating escrow invoice',
    fetchHelper: () =>
      newInvoiceId ? fetchInvoice(chainId, newInvoiceId) : undefined,
    checkResult: (v: Partial<Invoice>) => !_.isUndefined(v),
    interval: 2000, // 2 seconds (averaging ~20 seconds for the subgraph to index)
  });

  const paymentAmount = useMemo(() => {
    if (!tokenMetadata || !paymentDue) {
      return BigInt(0);
    }

    return parseUnits(_.toString(paymentDue), tokenMetadata.decimals);
  }, [tokenMetadata, paymentDue]);

  const escrowData = useMemo(() => {
    if (!client || !deadline || !wrappedNativeToken(chainId) || !details) {
      return '0x';
    }
    let lateFeeTimeIntervalSeconds = BigInt(0);
    if (lateFeeTimeInterval) {
      lateFeeTimeIntervalSeconds = BigInt(
        // days to milliseconds
        lateFeeTimeInterval * 24 * 60 * 60 * 1000,
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
        client,
        token, // address _token (payment token address)
        BigInt(new Date(deadline.toString()).getTime() / 1000), // deadline
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

  const { config, error: prepareError } = usePrepareContractWrite({
    address: invoiceFactory,
    chainId,
    abi: SMART_INVOICE_FACTORY_ABI,
    functionName: 'create',
    args: [
      provider,
      [paymentAmount],
      escrowData,
      toHex('instant', { size: 32 }),
    ],
    enabled: !!invoiceFactory && !!chainId && !!provider && !!escrowData,
  });

  const {
    writeAsync,
    error: writeError,
    isLoading,
  } = useContractWrite({
    ...config,
    onSuccess: async ({ hash }) => {
      // wait for tx to confirm on chain
      setWaitingForTx(true);
      toast.info(TOASTS.useInvoiceCreate.waitingForTx);

      const txData = await waitForTransaction({ chainId, hash });
      // wait for subgraph to index
      const localInvoiceId = parseTxLogs(
        LOG_TYPE.Factory,
        txData,
        'LogNewInvoice',
        'invoice',
      );
      if (!localInvoiceId) return;
      setNewInvoiceId(localInvoiceId);
      toast.info(TOASTS.useInvoiceCreate.waitingForIndex);

      await waitForResult();
      setWaitingForTx(false);

      // pass back to component for further processing
      onTxSuccess?.(localInvoiceId);
    },
    onError: error => errorToastHandler('useInvoiceCreate', error, toast),
  });

  return {
    waitingForTx,
    prepareError,
    writeAsync,
    writeError,
    isLoading,
  };
};

import {
  SMART_INVOICE_FACTORY_ABI,
  wrappedNativeToken,
} from '@smart-invoice/constants';
import { UseToastReturn } from '@smart-invoice/types';
import { getInvoiceFactoryAddress } from '@smart-invoice/utils';
import _ from 'lodash';
import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  encodeAbiParameters,
  parseUnits,
  toHex,
  TransactionReceipt,
} from 'viem';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

import { useDetailsPin } from './useDetailsPin';

export const useInstantCreate = ({
  invoiceForm,
  chainId,
  toast,
  onTxSuccess,
}: {
  invoiceForm: UseFormReturn;
  chainId: number;
  toast: UseToastReturn;
  onTxSuccess?: (result: TransactionReceipt) => void;
}) => {
  const invoiceFactory = getInvoiceFactoryAddress(chainId);

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

  const paymentAmount = useMemo(() => {
    if (!tokenMetadata || !paymentDue) {
      return BigInt(0);
    }

    return parseUnits(_.toString(paymentDue), tokenMetadata.decimals);
  }, [tokenMetadata, paymentDue]);

  const escrowData = useMemo(() => {
    if (
      !client ||
      !tokenMetadata ||
      !deadline ||
      !wrappedNativeToken(chainId) ||
      !details
    ) {
      return '0x';
    }
    let lateFeeTimeIntervalSeconds = BigInt(0);
    if (lateFeeTimeInterval) {
      lateFeeTimeIntervalSeconds = BigInt(
        // days to milliseconds
        lateFeeTimeInterval * 24 * 60 * 60 * 1000,
      );
    }

    return encodeAbiParameters(
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
        parseUnits(lateFee, tokenMetadata?.decimals || 18), // late fee in payment token per interval
        lateFeeTimeIntervalSeconds, // late fee time interval convert from some days duration to seconds
      ],
    );
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
      const txData = await waitForTransaction({ chainId, hash });

      onTxSuccess?.(txData);
    },
    onError: error => {
      // eslint-disable-next-line no-console
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

  return {
    prepareError,
    writeAsync,
    writeError,
    isLoading,
  };
};

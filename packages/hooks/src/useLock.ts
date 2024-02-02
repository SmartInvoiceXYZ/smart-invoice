import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types/src';
import { errorToastHandler } from '@smart-invoice/utils/src';
import _ from 'lodash';
import { Hex, TransactionReceipt } from 'viem';
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

export const useLock = ({
  invoice,
  disputeReason,
  amount,
  onTxSuccess,
  toast,
}: {
  invoice: Invoice;
  disputeReason: string;
  amount: string | undefined;
  onTxSuccess?: (result: TransactionReceipt) => void;
  toast: UseToastReturn;
}) => {
  console.log('useLock', invoice);

  const detailsHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000';

  // const detailsHash = await uploadDisputeDetails({
  //   reason: disputeReason,
  //   invoice: address,
  //   amount: balance.toString(),
  // });

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: invoice?.address as Hex,
    functionName: 'lock',
    abi: SMART_INVOICE_ESCROW_ABI,
    args: [detailsHash],
    enabled: !!invoice?.address && !!disputeReason,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async ({ hash }) => {
      const result = await waitForTransaction({ hash });

      onTxSuccess?.(result);
    },
    onError: error => errorToastHandler('useLock', error, toast),
  });

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    writeLoading,
    prepareError,
    writeError,
  };
};

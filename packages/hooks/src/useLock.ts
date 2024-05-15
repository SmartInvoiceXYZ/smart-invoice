import {
  DEFAULT_CHAIN_ID,
  SMART_INVOICE_ESCROW_ABI,
  TOASTS,
} from '@smart-invoice/constants';
import { fetchInvoice, InvoiceDetails } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types/src';
import { errorToastHandler } from '@smart-invoice/utils/src';
import _ from 'lodash';
import { Hex } from 'viem';
import { useChainId, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

import { usePollSubgraph } from '.';

export const useLock = ({
  invoice,
  disputeReason,
  // amount,
  onTxSuccess,
  toast,
}: {
  invoice: InvoiceDetails;
  disputeReason: string;
  amount: string | undefined;
  onTxSuccess?: () => void;
  toast: UseToastReturn;
}) => {
  const currentChainId = useChainId();
  const invoiceChainId = _.get(invoice, 'chainId') || DEFAULT_CHAIN_ID;

  const detailsHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000';

  // const detailsHash = await uploadDisputeDetails({
  //   reason: disputeReason,
  //   invoice: address,
  //   amount: balance.toString(),
  // });

  const waitForIndex = usePollSubgraph({
    label: 'waiting for useLock tx',
    fetchHelper: async () =>
      fetchInvoice(invoiceChainId, _.get(invoice, 'address') as Hex),
    checkResult: result => !!result?.locked === true,
  });

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: invoice?.address as Hex,
    functionName: 'lock',
    abi: SMART_INVOICE_ESCROW_ABI,
    args: [detailsHash],
    enabled:
      !!invoice?.address &&
      !!disputeReason &&
      currentChainId === invoiceChainId,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async ({ hash }) => {
      toast.info(TOASTS.useLock.waitingForTx);
      await waitForTransaction({ hash });

      toast.info(TOASTS.useLock.waitingForIndex);
      await waitForIndex();

      onTxSuccess?.();
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

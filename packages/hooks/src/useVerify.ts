import { SMART_INVOICE_ESCROW_ABI, TOASTS } from '@smart-invoice/constants';
import { fetchInvoice, InvoiceDetails } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types';
import { errorToastHandler } from '@smart-invoice/utils';
import { Hex, TransactionReceipt } from 'viem';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

import { usePollSubgraph } from '.';

export const useVerify = ({
  invoice,
  address,
  chainId,
  toast,
  onTxSuccess,
}: {
  invoice: InvoiceDetails;
  address: Hex | undefined;
  chainId: number;
  toast: UseToastReturn;
  onTxSuccess?: () => void;
}) => {
  const { config, error: prepareError } = usePrepareContractWrite({
    address,
    chainId,
    abi: SMART_INVOICE_ESCROW_ABI,
    functionName: 'verify', // no args
    enabled: !!address,
  });

  const waitForIndex = usePollSubgraph({
    label: 'Waiting for non-client deposit to be enabled',
    fetchHelper: () => fetchInvoice(chainId, invoice?.address as Hex),
    checkResult: result => !!result?.verified === true,
  });

  const {
    writeAsync,
    error: writeError,
    isLoading,
  } = useContractWrite({
    ...config,

    onSuccess: async ({ hash }) => {
      toast.info(TOASTS.useVerify.waitingForTx);
      await waitForTransaction({ hash, chainId });

      toast.info(TOASTS.useVerify.waitingForIndex);
      await waitForIndex();

      onTxSuccess?.();
    },
    onError: error => errorToastHandler('useVerify', error, toast),
  });

  return {
    writeAsync,
    prepareError,
    writeError,
    isLoading,
  };
};

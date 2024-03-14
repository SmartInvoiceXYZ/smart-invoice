import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types';
import { errorToastHandler } from '@smart-invoice/utils';
import _ from 'lodash';
import { Hex, TransactionReceipt } from 'viem';
import { useChainId, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

export const useWithdraw = ({
  invoice,
  onTxSuccess,
  toast,
}: {
  invoice: InvoiceDetails;
  onTxSuccess: (tx: TransactionReceipt) => void;
  toast: UseToastReturn;
}) => {
  const chainId = useChainId();
  const { address } = _.pick(invoice, ['address']);

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: address as Hex,
    functionName: 'withdraw',
    abi: SMART_INVOICE_ESCROW_ABI,
    // args: [],
    enabled: !!invoice?.address,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async ({ hash }) => {
      const data = await waitForTransaction({ hash, chainId });

      onTxSuccess?.(data);
    },
    onError: error => errorToastHandler('useWithdraw', error, toast),
  });

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};

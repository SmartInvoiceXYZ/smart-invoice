import { SMART_INVOICE_ESCROW_ABI, TOASTS } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { Hex } from 'viem';
import { useChainId, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { fetchBalance, waitForTransaction } from 'wagmi/actions';

import { usePollSubgraph } from './usePollSubgraph';

export const useWithdraw = ({
  invoice,
  onTxSuccess,
  toast,
}: {
  invoice: InvoiceDetails;
  onTxSuccess: () => void;
  toast: UseToastReturn;
}) => {
  const chainId = useChainId();
  const { address } = _.pick(invoice, ['address']);
  const { token } = _.pick(invoice, ['token', 'tokenBalance']);

  const waitForIndex = usePollSubgraph({
    label: 'useDeposit',
    fetchHelper: () =>
      fetchBalance({
        address: invoice?.address as Hex,
        chainId,
        token: token as Hex,
      }),
    checkResult: b => b.value !== 0,
    interval: 2000, // 2 seconds, averaging about 20 seconds for index by subgraph
  });

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
      toast.info(TOASTS.useWithdraw.waitingForTx);
      await waitForTransaction({ hash, chainId });

      toast.info(TOASTS.useWithdraw.waitingForIndex);
      await waitForIndex();

      onTxSuccess?.();
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

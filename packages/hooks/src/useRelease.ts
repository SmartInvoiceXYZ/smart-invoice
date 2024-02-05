import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants';
import { fetchInvoice, Invoice } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types';
import { errorToastHandler } from '@smart-invoice/utils/src';
import _ from 'lodash';
import { Hex } from 'viem';
import { useChainId, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

import { usePollSubgraph } from './usePollSubgraph';

export const useRelease = ({
  invoice,
  milestone,
  onTxSuccess,
  toast,
}: {
  invoice: Invoice;
  milestone?: number;
  onTxSuccess: () => void;
  toast: UseToastReturn;
}) => {
  const chainId = useChainId();

  const specifiedMilestone = _.isNumber(milestone);

  const waitForIndex = usePollSubgraph({
    label: 'waiting for funds to be released',
    fetchHelper: () => fetchInvoice(chainId, invoice?.address as Hex),
    checkResult: updatedInvoice =>
      invoice?.released ? updatedInvoice.released > invoice.released : false,
  });

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    chainId,
    address: invoice?.address as Hex,
    abi: SMART_INVOICE_ESCROW_ABI,
    functionName: 'release', // specifyMilestones ? 'release(uint256)' : 'release',
    args: specifiedMilestone ? [BigInt(milestone)] : undefined, // optional args
    enabled: !!invoice?.address,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async ({ hash }) => {
      await waitForTransaction({ hash, chainId });

      await waitForIndex();

      onTxSuccess?.();
    },
    onError: error => errorToastHandler('useRelease', error, toast),
  });

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};

import { SMART_INVOICE_ESCROW_ABI } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types';
import _ from 'lodash';
import { Hex } from 'viem';
import { useChainId, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { SendTransactionResult } from 'wagmi/actions';

export const useRelease = ({
  invoice,
  milestone,
  onSuccess,
  toast,
}: {
  invoice: Invoice;
  milestone?: number;
  onSuccess: (tx: SendTransactionResult) => void;
  toast: UseToastReturn;
}) => {
  const chainId = useChainId();

  const specifyMilestones = _.isNumber(milestone);

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    chainId,
    address: invoice?.address as Hex,
    abi: SMART_INVOICE_ESCROW_ABI,
    functionName: 'release', // specifyMilestones ? 'release(uint256)' : 'release',
    args: [BigInt(0)], //  specifyMilestones ? [milestone] : [], // optional args
    enabled: !!invoice?.address,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async tx => {
      onSuccess(tx);

      // handle success
      // close modal
      // update invoice with new balances
    },
    onError: async error => {
      // eslint-disable-next-line no-console
      console.log('release error', error);
    },
  });

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};
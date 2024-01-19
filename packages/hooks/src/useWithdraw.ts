import { Invoice } from '@smart-invoice/graphql';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ISmartInvoiceEscrowAbi } from '@smart-invoice/constants';
import _ from 'lodash';
import { Hex } from 'viem';

const useWithdraw = ({ invoice }: { invoice: Invoice }) => {
  const { address } = _.pick(invoice, ['address']);

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: address as Hex,
    functionName: 'withdraw',
    abi: ISmartInvoiceEscrowAbi,
    // args: [],
    enabled: !!invoice?.address,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: () => {
      console.log('success');

      // handle success
      // close modal
      // update invoice with status
    },
    onError: error => {
      // eslint-disable-next-line no-console
      console.log('error', error);
    },
  });

  return {
    writeAsync,
    isLoading: prepareLoading || writeLoading,
    prepareError,
    writeError,
  };
};

export default useWithdraw;

import { Invoice } from '@smart-invoice/types';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ISmartInvoiceEscrowAbi } from '@smart-invoice/constants';

const useWithdraw = ({ invoice }: { invoice: Invoice }) => {
  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    address: invoice.address,
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

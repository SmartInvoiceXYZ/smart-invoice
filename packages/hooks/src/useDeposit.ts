import { IERC20_ABI, PAYMENT_TYPES } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types';
import { ContractFunctionResult, Hex } from 'viem';
import {
  useChainId,
  useContractWrite,
  usePrepareContractWrite,
  useSendTransaction,
} from 'wagmi';

const errorToastHandler = (error: Error, toast: UseToastReturn) => {
  const localError = error as Error;
  if (
    localError.name === 'TransactionExecutionError' &&
    localError.message.includes('User rejected the request')
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
};

export const useDeposit = ({
  invoice,
  amount,
  hasAmount,
  paymentType,
  onSuccess,
  toast,
}: {
  invoice: Invoice;
  amount: bigint;
  hasAmount: boolean;
  paymentType: string;
  onSuccess?: (tx: ContractFunctionResult) => void;
  toast: UseToastReturn;
}) => {
  const chainId = useChainId();

  const token = invoice?.token;

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    chainId,
    address: token as Hex,
    abi: IERC20_ABI,
    functionName: 'transfer',
    args: [invoice?.address as Hex, amount],
    enabled: hasAmount && paymentType === PAYMENT_TYPES.TOKEN,
  });

  const {
    writeAsync,
    isLoading: writeLoading,
    error: writeError,
  } = useContractWrite({
    ...config,
    onSuccess: async tx => {
      console.log('deposit tx', tx);

      // TODO catch success
      onSuccess?.(tx);

      // wait for tx
      // update invoice
      // close modal
    },
    onError: async error => {
      // eslint-disable-next-line no-console
      console.log('deposit error', error);
    },
  });

  const { isLoading: sendLoading, sendTransactionAsync } = useSendTransaction({
    to: invoice?.address,
    value: amount,
  });

  const handleDeposit = async () => {
    try {
      if (paymentType === PAYMENT_TYPES.NATIVE) {
        const result = await sendTransactionAsync();
        return result;
      }

      const result = await writeAsync?.();
      return result;
    } catch (error: unknown) {
      errorToastHandler(error as Error, toast);
      return undefined;
    }
  };

  return {
    writeAsync,
    handleDeposit,
    isReady: true, // paymentType === PAYMENT_TYPES.NATIVE ? true : !!writeAsync,
    isLoading: prepareLoading || writeLoading || sendLoading,
    writeError,
    prepareError,
  };
};

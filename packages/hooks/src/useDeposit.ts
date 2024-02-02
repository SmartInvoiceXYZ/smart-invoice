import { IERC20_ABI, PAYMENT_TYPES } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import { UseToastReturn } from '@smart-invoice/types';
import { errorToastHandler } from '@smart-invoice/utils/src';
import { Hex, TransactionReceipt } from 'viem';
import {
  useChainId,
  useContractWrite,
  usePrepareContractWrite,
  useSendTransaction,
} from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

import { usePollSubgraph } from '.';

export const useDeposit = ({
  invoice,
  amount,
  hasAmount,
  paymentType,
  onTxSuccess,
  toast,
}: {
  invoice: Invoice;
  amount: bigint;
  hasAmount: boolean;
  paymentType: string;
  onTxSuccess?: (tx: TransactionReceipt) => void;
  toast: UseToastReturn;
}) => {
  const chainId = useChainId();

  const token = invoice?.token;

  const txResultData = usePollSubgraph({
    label: 'useDeposit',
    fetchHelper: () => undefined,
    checkResult: () => true,
  });

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
    onSuccess: async ({ hash }) => {
      const data = await waitForTransaction({ hash, chainId });

      onTxSuccess?.(data);
    },
    onError: async error => errorToastHandler('useDeposit', error, toast),
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
      errorToastHandler('useDeposit', error as Error, toast);
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

import { IERC20Abi } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import { ContractFunctionResult, Hex, parseUnits } from 'viem';
import {
  useChainId,
  useContractWrite,
  usePrepareContractWrite,
  useSendTransaction,
} from 'wagmi';

export const useDeposit = ({
  invoice,
  amount,
  hasAmount,
  paymentType,
  onSuccess,
}: {
  invoice: Invoice;
  amount: string;
  hasAmount: boolean;
  paymentType: string;
  onSuccess?: (tx: ContractFunctionResult) => void;
}) => {
  const chainId = useChainId();

  const token = invoice?.token;
  const depositAmount = BigInt(amount) && parseUnits(amount, 18);

  const {
    config,
    isLoading: prepareLoading,
    error: prepareError,
  } = usePrepareContractWrite({
    chainId,
    address: token as Hex,
    abi: IERC20Abi,
    functionName: 'transfer',
    args: [invoice?.address as Hex, depositAmount],
    enabled: hasAmount, // && paymentType === PAYMENT_TYPES.TOKEN,
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
    value: depositAmount,
  });

  const handleDeposit = async () => {
    // if (paymentType === PAYMENT_TYPES.NATIVE) {
    //   const result = await sendTransactionAsync();
    //   return result;
    // }

    const result = await writeAsync?.();
    return result;
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

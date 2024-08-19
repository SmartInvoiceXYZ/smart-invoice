import { IERC20_ABI, PAYMENT_TYPES, TOASTS } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils/src';
import _ from 'lodash';
import { Hex } from 'viem';
import {
  useChainId,
  useContractWrite,
  usePrepareContractWrite,
  useSendTransaction,
} from 'wagmi';
import { fetchBalance, waitForTransaction } from 'wagmi/actions';

import { usePollSubgraph } from './usePollSubgraph';

export const useDeposit = ({
  invoice,
  amount,
  hasAmount,
  paymentType,
  onTxSuccess,
  toast,
}: {
  invoice: InvoiceDetails;
  amount: bigint;
  hasAmount: boolean;
  paymentType: string;
  onTxSuccess?: () => void;
  toast: UseToastReturn;
}) => {
  const chainId = useChainId();

  const { token, tokenBalance } = _.pick(invoice, ['token', 'tokenBalance']);

  const waitForIndex = usePollSubgraph({
    label: 'useDeposit',
    fetchHelper: () =>
      fetchBalance({
        address: invoice?.address as Hex,
        chainId,
        token: token as Hex,
      }),
    checkResult: b =>
      tokenBalance?.value && b
        ? b.value === amount + tokenBalance.value
        : false,
    interval: 2000, // 2 seconds, averaging about 20 seconds for index by subgraph
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
      toast.info(TOASTS.useDeposit.waitingForTx);
      await waitForTransaction({ hash, chainId });

      toast.info(TOASTS.useDeposit.waitingForIndex);
      await waitForIndex();

      onTxSuccess?.();
    },
  });

  const { isLoading: sendLoading, sendTransactionAsync } = useSendTransaction({
    to: invoice?.address,
    value: amount,
    onSuccess: async ({ hash }) => {
      toast.info(TOASTS.useDeposit.waitingForTx);
      await waitForTransaction({ hash, chainId });

      toast.info(TOASTS.useDeposit.waitingForIndex);
      await waitForIndex();

      onTxSuccess?.();
    },
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

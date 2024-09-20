import { IERC20_ABI, PAYMENT_TYPES, TOASTS } from '@smartinvoicexyz/constants';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import { SimulateContractErrorType, WriteContractErrorType } from '@wagmi/core';
import _ from 'lodash';
import { useCallback } from 'react';
import { Hex } from 'viem';
import {
  useChainId,
  usePublicClient,
  useSendTransaction,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

import { usePollSubgraph } from './usePollSubgraph';
import { useTokenBalance } from './useToken';

export const useDeposit = ({
  invoice,
  amount,
  hasAmount,
  paymentType,
  onTxSuccess,
  toast,
}: {
  invoice: Partial<InvoiceDetails>;
  amount: bigint;
  hasAmount: boolean;
  paymentType: string;
  onTxSuccess?: () => void;
  toast: UseToastReturn;
}): {
  writeAsync: () => Promise<Hex | undefined>;
  handleDeposit: () => Promise<Hex | undefined>;
  isReady: boolean;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const chainId = useChainId();

  const { token, tokenBalance } = _.pick(invoice, ['token', 'tokenBalance']);

  const publicClient = usePublicClient();

  const { data: networkTokenBalance } = useTokenBalance({
    address: invoice?.address as Hex,
    tokenAddress: token as Hex,
    chainId,
  });

  const waitForIndex = usePollSubgraph({
    label: 'useDeposit',
    fetchHelper: async () => {},
    checkResult: () =>
      tokenBalance?.value && networkTokenBalance
        ? networkTokenBalance === amount + tokenBalance.value
        : false,
    interval: 2000, // 2 seconds, averaging about 20 seconds for index by subgraph
  });

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    chainId,
    address: token as Hex,
    abi: IERC20_ABI,
    functionName: 'transfer',
    args: [invoice?.address as Hex, amount],
    query: {
      enabled: hasAmount && paymentType === PAYMENT_TYPES.TOKEN,
    },
  });

  const {
    writeContractAsync,
    isPending: writeLoading,
    error: writeError,
  } = useWriteContract({
    mutation: {
      onSuccess: async hash => {
        toast.info(TOASTS.useDeposit.waitingForTx);
        await publicClient?.waitForTransactionReceipt({ hash });

        toast.info(TOASTS.useDeposit.waitingForIndex);
        await waitForIndex();

        onTxSuccess?.();
      },
    },
  });

  const { isPending: sendLoading, sendTransactionAsync } = useSendTransaction({
    mutation: {
      onSuccess: async hash => {
        toast.info(TOASTS.useDeposit.waitingForTx);
        await publicClient?.waitForTransactionReceipt({ hash });

        toast.info(TOASTS.useDeposit.waitingForIndex);
        await waitForIndex();

        onTxSuccess?.();
      },
    },
  });

  const handleDeposit = async (): Promise<Hex | undefined> => {
    try {
      if (paymentType === PAYMENT_TYPES.NATIVE) {
        const result = await sendTransactionAsync({
          to: invoice?.address as Hex,
          value: amount,
        });
        return result;
      }

      if (!data) {
        throw new Error('useDeposit: data is undefined');
      }

      const result = await writeContractAsync(data.request);
      return result;
    } catch (error: unknown) {
      errorToastHandler('useDeposit', error as Error, toast);
      return undefined;
    }
  };

  const writeAsync = useCallback(async (): Promise<Hex | undefined> => {
    try {
      if (!data) {
        throw new Error('simulation data is not available');
      }
      return writeContractAsync(data.request);
    } catch (error) {
      errorToastHandler('useDeposit', error as Error, toast);
      return undefined;
    }
  }, [writeContractAsync, data]);

  return {
    writeAsync,
    handleDeposit,
    isReady: true, // paymentType === PAYMENT_TYPES.NATIVE ? true : !!writeAsync,
    isLoading: prepareLoading || writeLoading || sendLoading,
    writeError,
    prepareError,
  };
};

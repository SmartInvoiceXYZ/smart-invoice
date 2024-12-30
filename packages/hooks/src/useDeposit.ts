import { IERC20_ABI, PAYMENT_TYPES, TOASTS } from '@smartinvoicexyz/constants';
import { waitForSubgraphSync } from '@smartinvoicexyz/graphql';
import { InvoiceDetails, UseToastReturn } from '@smartinvoicexyz/types';
import { errorToastHandler } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { Hex } from 'viem';
import {
  useChainId,
  usePublicClient,
  useSendTransaction,
  useSimulateContract,
  useWriteContract,
} from 'wagmi';

import { SimulateContractErrorType, WriteContractErrorType } from './types';

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
}): {
  handleDeposit: () => Promise<Hex | undefined>;
  isLoading: boolean;
  prepareError: SimulateContractErrorType | null;
  writeError: WriteContractErrorType | null;
} => {
  const chainId = useChainId();

  const { tokenMetadata, address } = _.pick(invoice, [
    'tokenMetadata',
    'address',
  ]);

  const publicClient = usePublicClient();

  const {
    data,
    isLoading: prepareLoading,
    error: prepareError,
  } = useSimulateContract({
    chainId,
    address: tokenMetadata?.address as Hex,
    abi: IERC20_ABI,
    functionName: 'transfer',
    args: [address as Hex, amount],
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
        toast.loading(TOASTS.useDeposit.waitingForTx);
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        toast.loading(TOASTS.useDeposit.waitingForIndex);
        if (receipt && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, receipt.blockNumber);
        }

        onTxSuccess?.();
      },
    },
  });

  const { isPending: sendLoading, sendTransactionAsync } = useSendTransaction({
    mutation: {
      onSuccess: async hash => {
        toast.loading(TOASTS.useDeposit.waitingForTx);
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        toast.loading(TOASTS.useDeposit.waitingForIndex);
        if (receipt && publicClient) {
          await waitForSubgraphSync(publicClient.chain.id, receipt.blockNumber);
        }

        onTxSuccess?.();
      },
    },
  });

  const handleDeposit = async (): Promise<Hex | undefined> => {
    try {
      if (paymentType === PAYMENT_TYPES.NATIVE) {
        const result = await sendTransactionAsync({
          to: address as Hex,
          value: amount,
        });
        return result;
      }

      if (!data) {
        throw new Error('useDeposit: simulation data is not available');
      }

      const result = await writeContractAsync(data.request);
      return result;
    } catch (error: unknown) {
      errorToastHandler('useDeposit', error as Error, toast);
      return undefined;
    }
  };

  return {
    handleDeposit,
    isLoading: prepareLoading || writeLoading || sendLoading,
    writeError,
    prepareError: paymentType === PAYMENT_TYPES.TOKEN ? prepareError : null,
  };
};

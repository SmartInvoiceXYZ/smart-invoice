import { SMART_INVOICE_INSTANT_ABI } from '@smart-invoice/constants';
import { Hex, TransactionReceipt, zeroAddress } from 'viem';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

export const useTip = ({
  address,
  token,
  amount,
  chainId,
  onTxSuccess,
}: TipProps) => {
  const { config } = usePrepareContractWrite({
    address,
    chainId,
    abi: SMART_INVOICE_INSTANT_ABI,
    functionName: 'tip',
    args: [token || zeroAddress, amount || BigInt(0)],
    enabled: !!address && !!chainId && !!token && !!amount,
  });

  const { writeAsync } = useContractWrite({
    ...config,
    onSuccess: async txHash => {
      // eslint-disable-next-line no-console
      console.log('Tip successful');
      const data = await waitForTransaction(txHash);

      onTxSuccess?.(data);
    },
  });

  return { writeAsync };
};

interface TipProps {
  chainId: number | undefined;
  address: Hex | undefined;
  token: Hex | undefined;
  amount: bigint | undefined;
  onTxSuccess?: (data: TransactionReceipt) => void;
}

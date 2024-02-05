import { SMART_INVOICE_INSTANT_ABI } from '@smart-invoice/constants';
import _ from 'lodash';
import { useMemo } from 'react';
import { Hex } from 'viem';
import { useContractReads } from 'wagmi';

export const useInstantDetails = ({
  address,
  chainId,
  enabled = true,
}: {
  address: Hex | undefined;
  chainId: number | undefined;
  enabled?: boolean;
}) => {
  const instantEscrowContract = {
    address,
    chainId,
    abi: SMART_INVOICE_INSTANT_ABI,
  };

  const { data: contractData, isLoading: contractReadLoading } =
    useContractReads({
      contracts: [
        {
          ...instantEscrowContract,
          functionName: 'getTotalDue',
        },
        {
          ...instantEscrowContract,
          functionName: 'totalFulfilled',
        },
        {
          ...instantEscrowContract,
          functionName: 'fulfilled',
        },
        {
          ...instantEscrowContract,
          functionName: 'deadline',
        },
        {
          ...instantEscrowContract,
          functionName: 'lateFee',
        },
        {
          ...instantEscrowContract,
          functionName: 'lateFeeTimeInterval',
        },
      ],
      enabled: enabled && !!address && !!chainId,
    });

  const parsedData = useMemo(() => {
    if (!contractData) return undefined;

    const [
      totalDue,
      amountFulfilled,
      fulfilled,
      deadline,
      lateFee,
      lateFeeTimeInterval,
    ] = _.map(contractData, 'result');
    return {
      totalDue: BigInt(totalDue as string),
      amountFulfilled: BigInt(amountFulfilled as string),
      fulfilled: fulfilled as boolean,
      deadline: BigInt(deadline as string),
      lateFee: BigInt(lateFee as string),
      lateFeeTimeInterval: BigInt(lateFeeTimeInterval as string),
    };
  }, [contractData]);

  return { data: parsedData, isLoading: contractReadLoading };
};

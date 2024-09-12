import { SMART_INVOICE_INSTANT_ABI } from '@smartinvoicexyz/constants';
import _ from 'lodash';
import { useMemo } from 'react';
import { Hex } from 'viem';
import { useReadContracts } from 'wagmi';

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
    useReadContracts({
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
      query: {
        enabled: enabled && !!address && !!chainId,
      },
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
      totalDue: totalDue as bigint,
      amountFulfilled: amountFulfilled as bigint,
      fulfilled: fulfilled as boolean,
      deadline: deadline as bigint,
      lateFee: lateFee as bigint,
      lateFeeTimeInterval: lateFeeTimeInterval as bigint,
    };
  }, [contractData]);

  return { data: parsedData, isLoading: contractReadLoading };
};

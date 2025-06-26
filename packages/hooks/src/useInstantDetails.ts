import { useQuery } from '@tanstack/react-query';
import { type QueryKey } from '@tanstack/react-query';
import _ from 'lodash';
import { useMemo } from 'react';
import { Hex } from 'viem';
import { useConfig } from 'wagmi';

import { fetchInstantInvoice } from './helpers';

export const createInstantDetailsQueryKey = ({
  address,
  chainId,
}: {
  address: Hex | undefined;
  chainId: number | undefined;
}) => ['instantDetails', { address, chainId }] as QueryKey;

export type UseInstantDetailsReturnType = {
  data?: {
    totalDue: bigint;
    amountFulfilled: bigint;
    fulfilled: boolean;
    deadline: bigint;
    lateFee: bigint;
    lateFeeTimeInterval: bigint;
  };
  isLoading: boolean;
  error?: Error | null;
};

export const useInstantDetails = ({
  address,
  chainId,
  enabled = true,
}: {
  address: Hex | undefined;
  chainId: number | undefined;
  enabled?: boolean;
}): UseInstantDetailsReturnType => {
  const config = useConfig();
  const {
    data: contractData,
    isLoading: contractReadLoading,
    error,
  } = useQuery({
    enabled: enabled && !!address && !!chainId,
    queryKey: createInstantDetailsQueryKey({ address, chainId }),
    queryFn: () => fetchInstantInvoice(config, address, chainId),
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
    ] = contractData;

    return {
      totalDue,
      amountFulfilled,
      fulfilled,
      deadline,
      lateFee,
      lateFeeTimeInterval,
    };
  }, [contractData]);

  return { data: parsedData, isLoading: contractReadLoading, error };
};

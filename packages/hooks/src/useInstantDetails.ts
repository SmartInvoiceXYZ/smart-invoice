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
}) => ['tokenBalance', { address, chainId }] as QueryKey;

export const useInstantDetails = ({
  address,
  chainId,
  enabled = true,
}: {
  address: Hex | undefined;
  chainId: number | undefined;
  enabled?: boolean;
}) => {
  const config = useConfig();
  const { data: contractData, isLoading: contractReadLoading } = useQuery({
    enabled: enabled && !!address && !!chainId,
    queryKey: createInstantDetailsQueryKey({ address, chainId }),
    queryFn: () => fetchInstantInvoice(config, address, chainId),
  });

  const parsedData = useMemo(() => {
    if (!contractData) return undefined;

    const [
      getTotalDue,
      totalFulfilled,
      fulfilled,
      deadline,
      lateFee,
      lateFeeTimeInterval,
    ] = _.map(contractData, 'result');

    return {
      totalDue: getTotalDue as bigint,
      amountFulfilled: totalFulfilled as bigint,
      fulfilled: fulfilled as boolean,
      deadline: deadline as bigint,
      lateFee: lateFee as bigint,
      lateFeeTimeInterval: lateFeeTimeInterval as bigint,
    };
  }, [contractData]);

  return { data: parsedData, isLoading: contractReadLoading };
};

import { SMART_INVOICE_FACTORY_ABI } from '@smartinvoicexyz/constants';
import { getInvoiceFactoryAddress } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { Hex } from 'viem';
import { useContractRead } from 'wagmi';

// Default Resolution Rate pulled from Factory
export const useRateForResolver = ({
  chainId,
  resolver,
  defaultValue = 20,
}: {
  chainId: number | undefined;
  resolver: Hex;
  defaultValue?: number;
}) => {
  const address = chainId ? getInvoiceFactoryAddress(chainId) : undefined;
  const { data, isLoading, error } = useContractRead({
    abi: SMART_INVOICE_FACTORY_ABI,
    address,
    chainId,
    functionName: 'resolutionRateOf',
    args: [resolver],
    enabled: !!address && !!resolver && !!chainId,
  });

  const resolutionRate = _.toNumber(data) || defaultValue;

  return { resolutionRate, isLoading, error };
};

import { SMART_INVOICE_FACTORY_ABI } from '@smartinvoicexyz/constants';
import { getInvoiceFactoryAddress } from '@smartinvoicexyz/utils';
import { Hex } from 'viem';
import { useReadContract } from 'wagmi';

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
  const { data, isLoading, error } = useReadContract({
    abi: SMART_INVOICE_FACTORY_ABI,
    address,
    chainId,
    functionName: 'resolutionRateOf',
    args: [resolver],
    query: {
      enabled: !!address && !!resolver && !!chainId,
    },
  });

  const resolutionRate = Number(data) || defaultValue;

  return { resolutionRate, isLoading, error } as {
    resolutionRate: number;
    isLoading: boolean;
    error: Error | undefined;
  };
};

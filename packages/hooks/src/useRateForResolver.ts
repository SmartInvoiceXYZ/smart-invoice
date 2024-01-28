import { SMART_INVOICE_FACTORY_ABI } from '@smart-invoice/constants/src';
import { getInvoiceFactoryAddress, logError } from '@smart-invoice/utils/src';
import { Hex } from 'viem';
import { useContractRead } from 'wagmi';

// Default Resolution Rate pulled from Factory
export const useRateForResolver = (
  chainId: number | undefined,
  resolver: Hex,
  defaultValue: number = 20,
) => {
  const address = chainId ? getInvoiceFactoryAddress(chainId) : undefined;
  const { data, isLoading } = useContractRead({
    abi: SMART_INVOICE_FACTORY_ABI,
    address,
    chainId,
    functionName: 'resolutionRateOf',
    args: [resolver],
    enabled: !!address && !!resolver && !!chainId,
  });

  const resolutionRate = data && data > 0 ? Number(data) : defaultValue;

  return { resolutionRate, isLoading };
};

import { fetchInvoice, Invoice } from '@smart-invoice/graphql';
import { useQuery } from '@tanstack/react-query';
import { Hex } from 'viem';

export const useInvoiceDetails = ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const { data, isLoading, error } = useQuery<Invoice>({
    queryKey: ['invoiceDetails', address, chainId],
    queryFn: () => fetchInvoice(chainId, address),
    enabled: !!address && !!chainId,
    staleTime: 1000 * 60 * 15,
  });

  return { data, isLoading, error };
};

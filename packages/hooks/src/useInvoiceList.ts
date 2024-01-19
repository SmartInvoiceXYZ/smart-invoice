import { useQuery } from '@tanstack/react-query';

export const useInvoiceList = ({ chainId }: UseInvoiceList) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['invoiceList', chainId],
    queryFn: () => [],
    enabled: !!chainId,
  });

  return {
    data,
    error,
    isLoading,
  };
};

interface UseInvoiceList {
  chainId: number;
}

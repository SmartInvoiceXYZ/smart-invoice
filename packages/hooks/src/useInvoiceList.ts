/* eslint-disable camelcase */
import { fetchInvoices, Invoice_orderBy } from '@smart-invoice/graphql';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Hex } from 'viem';
import { useAccount } from 'wagmi';

const handleFetchInvoices = async ({
  chainId,
  address,
}: {
  chainId: number | undefined;
  address: Hex | undefined;
}) => {
  if (!address || !chainId) return null;
  console.log(
    'fetching invoices',
    chainId,
    _.toLower(address),
    0,
    100,
    Invoice_orderBy.createdAt,
    false,
    () => {},
  );
  try {
    const result = await fetchInvoices(
      chainId,
      _.toLower(address),
      0,
      100,
      Invoice_orderBy.createdAt,
      false,
      () => {},
    );
    console.log(result);
    return result;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const useInvoiceList = ({ chainId }: UseInvoiceList) => {
  const { address } = useAccount();

  const { data, error, isLoading } = useQuery({
    queryKey: ['invoiceList', chainId],
    queryFn: () => handleFetchInvoices({ chainId, address }),
    enabled: !!chainId && !!address,
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

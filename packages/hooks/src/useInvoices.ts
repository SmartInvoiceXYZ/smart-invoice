/* eslint-disable camelcase */
import { SUPPORTED_NETWORKS } from '@smartinvoicexyz/constants';
import {
  fetchInvoices,
  Invoice_orderBy,
  InvoiceDisplayData,
} from '@smartinvoicexyz/graphql';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Address } from 'viem';
import { useAccount } from 'wagmi';

const PAGE_SIZE = 10;
const fetchInvoicesForPage = async (
  chainId: number,
  address: Address | undefined,
  page: number,
) =>
  fetchInvoices(
    chainId,
    address,
    page,
    PAGE_SIZE,
    Invoice_orderBy.createdAt,
    true,
  );

const removeDuplicates = (
  acc: InvoiceDisplayData[],
  invoice: InvoiceDisplayData,
) => {
  if (
    !acc.find(
      i => i.network === invoice.network && i.address === invoice.address,
    )
  ) {
    acc.push(invoice);
  }
  return acc;
};

const fetchAllInvoices = async (address: Address | undefined, page: number) => {
  const datas = await Promise.all(
    SUPPORTED_NETWORKS.map(async chainId =>
      fetchInvoicesForPage(chainId, address, page),
    ),
  );

  return _.flatMap(datas, data => data ?? [])
    .reduce(removeDuplicates, [])
    .sort((a, b) => Number(b.createdAt - a.createdAt));
};

export const useInvoices = ({ page }: { page: number }) => {
  const { address, isConnected } = useAccount();
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['invoices', address?.toLowerCase(), page],
    queryFn: () => fetchAllInvoices(address, page),
    enabled: !!address && isConnected,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  return { data, isLoading, isFetching, isError, error };
};

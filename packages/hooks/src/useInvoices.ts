/* eslint-disable camelcase */
import {
  fetchInvoices,
  Invoice_orderBy,
  InvoiceDisplayData,
} from '@smartinvoicexyz/graphql';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Address } from 'viem';
import { useAccount, useChainId } from 'wagmi';

const PAGE_SIZE = 100;
const fetchInvoicesForPage = async (
  chainId: number,
  address: Address | undefined,
  page: number,
): Promise<Array<InvoiceDisplayData>> =>
  fetchInvoices(
    chainId,
    address,
    page,
    PAGE_SIZE,
    Invoice_orderBy.createdAt,
    true,
  );

// const removeDuplicates = (
//  acc: InvoiceDisplayData[],
//  invoice: InvoiceDisplayData,
// ) => {
//  if (
//    !acc.find(
//      i => i.network === invoice.network && i.address === invoice.address,
//    )
//  ) {
//    acc.push(invoice);
//  }
//  return acc;
// };
//
// export const useInvoices = ({ page }: { page: number }) => {
//  const { address, isConnected } = useAccount();
//  const queries = useQueries({
//    queries: SUPPORTED_NETWORKS.map(chainId => ({
//      queryKey: ['invoices', address?.toLowerCase(), chainId, page],
//      queryFn: () => fetchInvoicesForPage(chainId, address, page),
//      enabled: !!address && isConnected,
//      refetchInterval: 60000,
//    })),
//  });
//
//  const data = _.flatMap(queries, query => query.data ?? []).reduce(removeDuplicates, []).sort((a, b) => Number(b.createdAt - a.createdAt));
//  const isLoading = queries.some(query => query.isLoading);
//  const isFetching = queries.some(query => query.isFetching);
//  const isError = queries.some(query => query.isError);
//  const error = queries.find(query => query.isError)?.error;
//
//  return { data, isLoading, isFetching, isError, error };
// };

export const useInvoices = ({ page }: { page: number }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const result = useQuery({
    queryKey: ['invoices', address?.toLowerCase(), chainId, page],
    queryFn: () => fetchInvoicesForPage(chainId, address, page),
    enabled: !!address && !!chainId && isConnected,
    refetchInterval: 60000,
  });

  return result;
};

/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */

import { logDebug } from '@smart-invoice/utils';
import { Address, isAddress } from 'viem';

import { clients } from './client';
import { scalars } from './scalars';
import { _SubgraphErrorPolicy_, Invoice_orderBy, OrderDirection } from './zeus';
import { typedGql } from './zeus/typedDocumentNode';

export type SearchInputType = string | Address | undefined;

const buildInvoicesFilter = (searchInput: SearchInputType) => {
  if (!searchInput) return undefined;
  if (isAddress(searchInput)) {
    return {
      or: [
        { address_contains: searchInput },
        { client_contains: searchInput },
        { provider_contains: searchInput },
        { resolver_contains: searchInput },
      ],
    };
  }
  return { projectName_contains: searchInput };
};

const invoicesQuery = (
  first?: number,
  skip?: number,
  orderBy?: Invoice_orderBy,
  orderDirection?: OrderDirection,
  where?: ReturnType<typeof buildInvoicesFilter>,
) =>
  typedGql('query', { scalars })({
    invoices: [
      {
        first,
        skip,
        orderBy,
        orderDirection,
        where,
        subgraphError: _SubgraphErrorPolicy_.allow,
      },
      {
        id: true,
        address: true,
        createdAt: true,
        invoiceType: true,
        network: true,
        projectName: true,
        released: true,
        token: true,
        total: true,
        tokenMetadata: { id: true, decimals: true, name: true, symbol: true },
      },
    ],
  });

export const fetchInvoices = async (
  chainId: number,
  searchInput: SearchInputType,
  pageIndex: number,
  pageSize: number,
  sortBy: Invoice_orderBy,
  sortDesc: boolean = false,
) => {
  if (chainId < 0) return undefined;

  const sortDirection = sortDesc ? OrderDirection.desc : OrderDirection.asc;
  const where = buildInvoicesFilter(searchInput);

  logDebug({ chainId, pageIndex, pageSize, sortBy, sortDirection, where });

  const query = invoicesQuery(
    pageSize,
    pageIndex * pageSize,
    sortBy,
    sortDirection,
    where,
  );
  const { data, error } = await clients[chainId].query({ query });

  logDebug({
    data,
    error,
    chainId,
    searchInput,
    pageIndex,
    pageSize,
    sortBy,
    sortDesc,
  });

  if (!data) {
    if (error) {
      throw error;
    }
    return null;
  }

  return data.invoices;
};

// type GetElementType<T extends any[] | undefined | null> = T extends (infer U)[]
//   ? U
//   : never;
// type Invoices = Awaited<ReturnType<typeof fetchInvoices>>;
// export type Invoice = GetElementType<Invoices>;

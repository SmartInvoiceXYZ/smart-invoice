/* eslint-disable camelcase */

import { logDebug } from '@smartinvoicexyz/shared';
import { Address, isAddress } from 'viem';

import { fetchTypedQuery } from './client';
import { _SubgraphErrorPolicy_, Invoice_orderBy, OrderDirection } from './zeus';

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

export const fetchInvoices = async (
  chainId: number,
  searchInput: SearchInputType,
  pageIndex: number,
  pageSize: number,
  sortBy: Invoice_orderBy,
  sortDesc: boolean = false,
) => {
  if (chainId < 0) return [];

  const sortDirection = sortDesc ? OrderDirection.desc : OrderDirection.asc;
  const where = buildInvoicesFilter(searchInput);

  logDebug({ chainId, pageIndex, pageSize, sortBy, sortDirection, where });

  const data = await fetchTypedQuery(chainId)({
    invoices: [
      {
        first: pageSize,
        skip: pageIndex * pageSize,
        orderBy: sortBy,
        orderDirection: sortDirection,
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
        ipfsHash: true,
        released: true,
        token: true,
        total: true,
        tokenMetadata: { id: true, decimals: true, name: true, symbol: true },
      },
    ],
  });

  logDebug({
    data,
    chainId,
    searchInput,
    pageIndex,
    pageSize,
    sortBy,
    sortDesc,
  });

  return data?.invoices ?? [];
};

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type InvoicesArray = Awaited<ReturnType<typeof fetchInvoices>>;

export type InvoiceMetadata = ArrayElement<InvoicesArray>;

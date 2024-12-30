/* eslint-disable camelcase */
import { logDebug } from '@smartinvoicexyz/shared';
import { Hex } from 'viem';

import { fetchTypedQuery } from './client';
import { _SubgraphErrorPolicy_, Invoice_orderBy, OrderDirection } from './zeus';

export type SearchAddressType = string | Hex | undefined;

const buildInvoicesFilter = (searchAddress: SearchAddressType) => {
  return {
    or: [
      { address: searchAddress?.toLowerCase() },
      { client: searchAddress?.toLowerCase() },
      { provider: searchAddress?.toLowerCase() },
      { resolver: searchAddress?.toLowerCase() },
    ],
  };
};

export type InvoiceDisplayData = {
  id: string;
  address: Hex;
  invoiceType?: string | undefined;
  chainId: number;
  network: string;
  ipfsHash: Hex;
  released: bigint;
  token: Hex;
  total: bigint;
  deposits: { amount: bigint }[];
  releases: { amount: bigint }[];
  amounts: bigint[];
  isLocked: boolean;
  terminationTime: bigint;
  status?:
    | 'Awaiting Funds'
    | 'In Progress'
    | 'Locked'
    | 'Expired'
    | 'Completed';
  tokenMetadata: {
    id: string;
    decimals: number;
    name: string;
    symbol: string;
  };
  provider: Hex;
  providerReceiver: Hex;
  client: Hex;
  resolver: Hex;
};

export const fetchInvoices = async (
  chainId: number,
  searchAddress: SearchAddressType,
  pageIndex: number,
  pageSize: number,
  sortBy: Invoice_orderBy,
  sortDesc: boolean = false,
) => {
  const sortDirection = sortDesc ? OrderDirection.desc : OrderDirection.asc;
  const where = buildInvoicesFilter(searchAddress);

  const data = await fetchTypedQuery(chainId)(
    {
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
          invoiceType: true,
          network: true,
          ipfsHash: true,
          released: true,
          token: true,
          total: true,
          isLocked: true,
          deposits: [{}, { amount: true }],
          releases: [{}, { amount: true }],
          amounts: true,
          withdraws: [{}, { amount: true }],
          tokenMetadata: { id: true, decimals: true, name: true, symbol: true },
          provider: true,
          providerReceiver: true,
          client: true,
          resolver: true,
          terminationTime: true,
        },
      ],
    },
    { fetchPolicy: 'network-only' },
  );

  logDebug({
    data,
    chainId,
    searchAddress,
    pageIndex,
    pageSize,
    sortBy,
    sortDesc,
  });

  return (data?.invoices ?? []).map(invoice => {
    return {
      ...invoice,
      chainId,
      amounts: invoice.amounts.map(amount => BigInt(amount)),
    };
  }) as InvoiceDisplayData[];
};

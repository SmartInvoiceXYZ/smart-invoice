// @ts-expect-error TS(2792): Cannot find module 'fake-tag'. Did you mean to set... Remove this comment to see the full error message
import gql from 'fake-tag';

import { isAddress } from '../utils/helpers';
import { clients } from './client';
import { InvoiceDetails } from './fragments';

const searchQuery = gql`
  query Search($search: String, $first: Int) {
    invoices(
      first: $first
      where: { projectName_contains: $search }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...InvoiceDetails
    }
  }
  ${InvoiceDetails}
`;

const addressSearchQuery = gql`
  query AddressSearch($search: Bytes, $first: Int) {
    addressInvoices: invoices(
      first: $first
      where: { address_contains: $search, projectName_not: "" }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...InvoiceDetails
    }
    clientInvoices: invoices(
      first: $first
      where: { client_contains: $search, projectName_not: "" }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...InvoiceDetails
    }
    providerInvoices: invoices(
      first: $first
      where: { provider_contains: $search, projectName_not: "" }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...InvoiceDetails
    }
    resolverInvoices: invoices(
      first: $first
      where: { resolver_contains: $search, projectName_not: "" }
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...InvoiceDetails
    }
  }
  ${InvoiceDetails}
`;

export const search = async (chainId: any, searchInput: any, first = 10) => {
  const isAddressSearch = isAddress(searchInput);

  const query = isAddressSearch ? addressSearchQuery : searchQuery;
  const { data, error } = await clients[chainId]
    .query(query, {
      first,
      search: isAddressSearch || searchInput,
    })
    .toPromise();

  if (!data) {
    if (error) {
      throw error;
    }

    return undefined;
  }

  return isAddressSearch
    ? [
        ...data.addressInvoices,
        ...data.clientInvoices,
        ...data.providerInvoices,
        ...data.resolverInvoices,
      ]
    : data.invoices;
};

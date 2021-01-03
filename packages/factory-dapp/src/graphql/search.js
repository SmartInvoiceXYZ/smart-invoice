import {client} from './client';
import gql from 'fake-tag';
import {isAddress} from '../utils/Helpers';
import {InvoiceDetails} from './fragments';

const searchQuery = gql`
  query Search($search: String, $first: Int) {
    invoices(
      first: $first
      where: {projectName_contains: $search}
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
      where: {address_contains: $search}
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...InvoiceDetails
    }
    clientInvoices: invoices(
      first: $first
      where: {client_contains: $search}
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...InvoiceDetails
    }
    providerInvoices: invoices(
      first: $first
      where: {provider_contains: $search}
      orderBy: createdAt
      orderDirection: desc
    ) {
      ...InvoiceDetails
    }
  }
  ${InvoiceDetails}
`;

export const search = async (searchInput, first = 10) => {
  const isAddressSearch = isAddress(searchInput);

  const query = isAddressSearch ? addressSearchQuery : searchQuery;
  const {data, error} = await client
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
      ]
    : data.invoices;
};

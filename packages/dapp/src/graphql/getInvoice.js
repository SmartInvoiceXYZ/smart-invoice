import gql from 'fake-tag';

import { isAddress } from '../utils/helpers';
import { client } from './client';
import { InvoiceDetails } from './fragments';

const invoiceQuery = gql`
  query GetInvoice($address: ID!) {
    invoice(id: $address) {
      ...InvoiceDetails
    }
  }
  ${InvoiceDetails}
`;

export const getInvoice = async query => {
  const address = isAddress(query);
  if (!address) return null;
  const { data, error } = await client
    .query(invoiceQuery, { address })
    .toPromise();
  if (!data) {
    if (error) {
      throw error;
    }
  }
  return data.invoice;
};

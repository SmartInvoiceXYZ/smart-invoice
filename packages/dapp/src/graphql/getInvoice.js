import {client} from './client';
import gql from 'fake-tag';
import {InvoiceDetails} from './fragments';
import {isAddress} from '../utils/Helpers';

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
  const {data, error} = await client.query(invoiceQuery, {address}).toPromise();
  if (!data) {
    if (error) {
      throw error;
    }
  }
  return data.invoice;
};

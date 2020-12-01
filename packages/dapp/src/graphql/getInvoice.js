import {client} from './client';
import gql from 'fake-tag';
import {InvoiceDetails} from './fragments';

const invoiceQuery = gql`
  query GetInvoice($index: ID!) {
    invoice(id: $index) {
      ...InvoiceDetails
    }
  }
  ${InvoiceDetails}
`;

export const getInvoice = async index => {
  if (!index) return null;
  const {data, error} = await client
    .query(invoiceQuery, {index: `0x${index.toString(16)}`})
    .toPromise();
  if (!data) {
    if (error) {
      throw error;
    }
  }
  return data.invoice;
};

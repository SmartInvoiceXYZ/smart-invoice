import gql from 'fake-tag';

import { isAddress } from '../utils/helpers';
import { clients } from './client';
import { InvoiceDetails } from './fragments';

const invoiceQuery = gql`
  query GetInvoice($address: ID!) {
    invoice(id: $address) {
      ...InvoiceDetails
    }
  }
  ${InvoiceDetails}
`;

export const getInvoice = async (chainId, queryAddress) => {
  console.log(queryAddress, 'query');
  const address = isAddress(queryAddress);
  if (!address) return null;
  const { data, error } = await clients[chainId]
    .query(invoiceQuery, { address })
    .toPromise();

  console.log({ data, error });

  if (!data) {
    if (error) {
      throw error;
    }
    return null;
  }
  return data.invoice;
};

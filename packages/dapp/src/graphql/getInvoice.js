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

const invoiceQueryVerified = gql`
  query GetInvoice($address: ID!) {
    invoice(id: $address) {
      ...InvoiceDetails
      verified {
        client
        invoice
      }
    }
  }
  ${InvoiceDetails}
`;

export const getInvoice = async (chainId, queryAddress) => {
  const address = isAddress(queryAddress);
  if (!address) return null;
  let dataInvoice;
  let errorInvoice;

  // function multipleReturns(queryType) {
  //   const { data, error } = await clients[chainId]
  //   .query(queryType, { address })
  //   .toPromise();
  //   if (data) {
  //   dataInvoice = data;
  //   errorInvoice = error;
  // }

  try {
    const { data, error } = await clients[chainId]
      .query(invoiceQueryVerified, { address })
      .toPromise();
    if (data) {
      dataInvoice = data;
      errorInvoice = error;
    } else {
      const { data, error } = await clients[chainId]
        .query(invoiceQuery, { address })
        .toPromise();
      if (data) {
        dataInvoice = data;
        errorInvoice = error;
      }
    }
  } catch (error) {
    console.log('try/catch error:', error);
    if (error) {
      throw error;
    }
    return null;
  }
  // console.log({ data, error });

  // if (!data) {
  //   if (error) {
  //     throw error;
  //   }
  //   return null;
  // }
  // return data.invoice;
  return dataInvoice.invoice;
};

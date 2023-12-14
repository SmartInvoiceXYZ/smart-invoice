// @ts-expect-error TS(2792): Cannot find module 'fake-tag'. Did you mean to set... Remove this comment to see the full error message
import gql from 'fake-tag';
import { Address } from 'viem';

import { Invoice } from '../types';
import { isAddress, logDebug } from '../utils/helpers';
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

export const getInvoice = async (chain: number, queryAddress: Address) => {
  const address = isAddress(queryAddress);
  if (!address) return null;
  const { data, error } = await clients[chain]
    .query(invoiceQuery, { address })
    .toPromise();

  logDebug({ data, error, address });

  if (!data) {
    if (error) {
      throw error;
    }
    return null;
  }
  return data.invoice as Invoice;
};

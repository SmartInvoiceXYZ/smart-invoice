import gql from 'fake-tag';

// import { SUPPORTED_NETWORKS } from '../utils/constants';
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
  const address = isAddress(queryAddress);
  if (!address) return null;
  const { data, error } = await clients[chainId]
    .query(invoiceQuery, { address })
    .toPromise();
  if (!data) {
    if (error) {
      throw error;
    }
    return null;
  }
  return data.invoice;
};

// export const getInvoice = async (chainId, queryAddress, tryAll = false) => {
//   let invoice = await getInvoiceFromChainId(chainId, queryAddress);
//   if (!invoice && tryAll) {
//     const otherChainIds = new Set(SUPPORTED_NETWORKS);
//     otherChainIds.delete(chainId);
//     for (const chain of otherChainIds) {
//       // eslint-ignore-next-line no-await-in-loop
//       invoice = await getInvoiceFromChainId(chain, queryAddress);
//       if (invoice) {
//         break;
//       }
//     }
//   }
//   return invoice;
// };

import gql from 'fake-tag';

import { isAddress } from '../utils/helpers';
import { clients } from './client';

const verifiedQuery = gql`
  query GetVerified($address: ID!) {
    verifieds(where: { invoice: $address }) {
      client
      invoice
    }
  }
`;

export const getVerified = async (chainId, queryAddress) => {
  const address = isAddress(queryAddress);
  if (!address) return null;
  const { data, error } = await clients[chainId]
    .query(verifiedQuery, { address })
    .toPromise();

  if (!data) {
    if (error) {
      throw error;
    }
    return null;
  }
  return data;
};

import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import { SUPPORTED_NETWORKS } from '@smartinvoicexyz/constants';
import { getGraphUrl } from '@smartinvoicexyz/shared';
import gql from 'graphql-tag';

import { apolloScalars } from './scalars';

export const cache = new InMemoryCache();

export const clients = SUPPORTED_NETWORKS.reduce(
  (o, chainId) => ({
    ...o,
    [chainId]: new ApolloClient({
      uri: getGraphUrl(chainId),
      cache,
      typeDefs: gql`
        scalar BigDecimal
        scalar BigInt
        scalar Bytes
        scalar Int8
      `,
      // Custom scalar resolvers for handling the custom scalars
      resolvers: apolloScalars,
    }),
  }),
  {} as Record<number, ApolloClient<NormalizedCacheObject>>,
);

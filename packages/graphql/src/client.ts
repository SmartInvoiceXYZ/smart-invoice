import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';

import { SUPPORTED_NETWORKS } from '@smart-invoice/constants';
import { getGraphUrl } from '@smart-invoice/utils';

const cache = new InMemoryCache();

export const clients = SUPPORTED_NETWORKS.reduce(
  (o, chainId) => ({
    ...o,
    [chainId]: new ApolloClient({
      uri: getGraphUrl(chainId),
      cache,
    }),
  }),
  {} as Record<number, ApolloClient<NormalizedCacheObject>>,
);

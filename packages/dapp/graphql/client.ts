import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';

import { SUPPORTED_NETWORKS } from '../constants';
import { getGraphUrl } from '../utils/helpers';

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

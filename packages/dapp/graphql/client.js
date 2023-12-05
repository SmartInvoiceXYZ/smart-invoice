import { createClient, dedupExchange, fetchExchange } from 'urql';

import { SUPPORTED_NETWORKS } from '../constants';
import { getGraphUrl } from '../utils/helpers';

export const clients = SUPPORTED_NETWORKS.reduce(
  (o, chainId) => ({
    ...o,
    [chainId]: createClient({
      url: getGraphUrl(chainId),
      exchanges: [dedupExchange, fetchExchange],
    }),
  }),
  {},
);

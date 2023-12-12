import { createClient, dedupExchange, fetchExchange } from 'urql';

import { SUPPORTED_NETWORKS } from '../constants';
import { getGraphUrl } from '../utils/helpers';

export const clients = SUPPORTED_NETWORKS.reduce(
  (o, chain) => ({
    ...o,

    [chain]: createClient({
      url: getGraphUrl(chain),
      exchanges: [dedupExchange, fetchExchange],
    }),
  }),
  {} as Record<number, ReturnType<typeof createClient>>,
);

import { createClient } from 'urql';

import { GRAPH_URL } from '../utils/constants';

export const client = createClient({
  url: GRAPH_URL,
});

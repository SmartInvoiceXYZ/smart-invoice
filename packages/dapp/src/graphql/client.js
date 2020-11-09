import { graph_url } from '../utils/Constants';
import { createClient } from 'urql';

export const client = createClient({
    url: graph_url,
});

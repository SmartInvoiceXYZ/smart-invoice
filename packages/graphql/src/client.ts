import { SUPPORTED_NETWORKS } from '@smart-invoice/constants';
import { getGraphUrl } from '@smart-invoice/shared';
import { GraphQLClient } from 'graphql-request';

export const clients = SUPPORTED_NETWORKS.map((network: number) => ({
  network,
  client: new GraphQLClient(getGraphUrl(network)),
}));

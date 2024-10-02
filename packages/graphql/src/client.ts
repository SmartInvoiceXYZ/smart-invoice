import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  QueryOptions,
} from '@apollo/client';
import { SUPPORTED_NETWORKS } from '@smartinvoicexyz/constants';
import { getGraphUrl } from '@smartinvoicexyz/shared';

import { scalars } from './scalars';
import {
  decodeScalarsInResponse,
  GenericOperation,
  GraphQLTypes,
  InputType,
  OperationOptions,
  ValueTypes,
  VType,
} from './zeus';
import { Ops, ReturnTypes } from './zeus/const';
import { typedGql } from './zeus/typedDocumentNode';

const caches: Record<number, InMemoryCache> = SUPPORTED_NETWORKS.reduce(
  (o, chainId) => ({
    ...o,
    [chainId]: new InMemoryCache(),
  }),
  {} as Record<number, InMemoryCache>,
);

export const getCache = (chainId: number) => caches[chainId];

const clients = SUPPORTED_NETWORKS.reduce(
  (o, chainId) => ({
    ...o,
    [chainId]: new ApolloClient({
      uri: getGraphUrl(chainId),
      cache: caches[chainId],
    }),
  }),
  {} as Record<number, ApolloClient<NormalizedCacheObject>>,
);

type Scalars = typeof scalars;

export const fetchTypedQuery =
  <
    O extends keyof typeof Ops,
    R extends keyof ValueTypes = GenericOperation<O>,
  >(
    chainId: number,
  ) =>
  async <Z extends ValueTypes[R]>(
    o: Z & {
      [P in keyof Z]: P extends keyof ValueTypes[R] ? Z[P] : never;
    },
    ops?: OperationOptions & { variables?: Record<string, unknown> } & Omit<
        QueryOptions,
        'query' | 'variables'
      >,
  ): Promise<InputType<GraphQLTypes[R], Z, Scalars>> => {
    const gql = typedGql<O, Scalars, R>('query' as O, { scalars })(o, ops);

    const { data, error } = await clients[chainId].query({
      query: gql,
      ...ops,
    });

    if (error) throw error;

    return decodeScalarsInResponse({
      response: data,
      initialOp: 'query' as O,
      initialZeusQuery: o as VType,
      returns: ReturnTypes,
      scalars,
      ops: Ops,
    });
  };

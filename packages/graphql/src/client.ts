import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import { SUPPORTED_NETWORKS } from '@smartinvoicexyz/constants';
import { getGraphUrl } from '@smartinvoicexyz/shared';

import {
  decodeScalarsInResponse,
  GenericOperation,
  GraphQLTypes,
  InputType,
  OperationOptions,
  ScalarDefinition,
  ThunderGraphQLOptions,
  ValueTypes,
  VType,
} from './zeus';
import { Ops, ReturnTypes } from './zeus/const';
import { typedGql } from './zeus/typedDocumentNode';

export const cache = new InMemoryCache();

const clients = SUPPORTED_NETWORKS.reduce(
  (o, chainId) => ({
    ...o,
    [chainId]: new ApolloClient({
      uri: getGraphUrl(chainId),
      cache,
    }),
  }),
  {} as Record<number, ApolloClient<NormalizedCacheObject>>,
);

export const fetchTypedQuery =
  <
    O extends keyof typeof Ops,
    SCLR extends ScalarDefinition,
    R extends keyof ValueTypes = GenericOperation<O>,
  >(
    chainId: number,
    operation: O,
    options?: ThunderGraphQLOptions<SCLR>,
  ) =>
  async <Z extends ValueTypes[R]>(
    o: Z & {
      [P in keyof Z]: P extends keyof ValueTypes[R] ? Z[P] : never;
    },
    ops?: OperationOptions & { variables?: Record<string, unknown> },
  ): Promise<InputType<GraphQLTypes[R], Z, SCLR>> => {
    const gql = typedGql<O, SCLR, R>(operation, options)(o, ops);

    if (operation === 'subscription') {
      throw new Error('Subscriptions are not supported');
    }

    const { data, error } = await clients[chainId].query({
      query: gql,
      variables: ops?.variables,
    });

    if (error) throw error;

    if (options?.scalars) {
      return decodeScalarsInResponse({
        response: data,
        initialOp: operation,
        initialZeusQuery: o as VType,
        returns: ReturnTypes,
        scalars: options.scalars,
        ops: Ops,
      });
    }
    return data as InputType<GraphQLTypes[R], Z, SCLR>;
  };

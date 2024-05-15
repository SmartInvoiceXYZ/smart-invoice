import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import gql from 'graphql-tag';

import {
  ExtractVariables,
  GenericOperation,
  GraphQLTypes,
  InputType,
  OperationOptions,
  ScalarDefinition,
  ThunderGraphQLOptions,
  ValueTypes,
  Zeus,
} from '.';
import { Ops } from './const';

export const typedGql =
  <
    O extends keyof typeof Ops,
    SCLR extends ScalarDefinition,
    R extends keyof ValueTypes = GenericOperation<O>,
  >(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: (Z & ValueTypes[R]) | ValueTypes[R],
    ops?: OperationOptions,
  ) => {
    const str = Zeus(operation, o, {
      operationOptions: ops,
      scalars: graphqlOptions?.scalars,
    });
    return gql(str) as TypedDocumentNode<
      InputType<GraphQLTypes[R], Z, SCLR>,
      ExtractVariables<Z>
    >;
  };

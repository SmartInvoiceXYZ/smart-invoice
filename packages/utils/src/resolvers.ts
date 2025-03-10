import _ from 'lodash';
import { isAddress } from 'viem';
import * as Yup from 'yup';

import { sevenDaysFromDate } from './date';
import { isKnownResolver, isValidURL } from './helpers';

export const escrowDetailsSchema = (chainId: number) =>
  Yup.object().shape({
    client: Yup.string()
      .required('Client address is required')
      .test({
        name: 'clientIsAddress',
        test: (v, { createError }) => {
          if (!!v && isAddress(v)) return true;
          return createError({
            path: 'client',
            message: 'Client must be a valid address',
          });
        },
      })
      .when('provider', (p, localSchema) => {
        if (!p) return localSchema;

        return localSchema.test({
          name: 'clientNotProvider',
          test: (v, { createError }) => {
            if (_.toLower(v) !== _.toLower(_.first(p))) return true;
            return createError({
              path: 'client',
              message: 'Client cannot be same as provider',
            });
          },
        });
      }),
    clientReceiver: Yup.string()
      .optional()
      .test({
        name: 'clientReceiverIsAddress',
        test: (v, { createError }) => {
          if (!v || isAddress(v)) return true;
          return createError({
            path: 'clientReceiver',
            message: 'Client receiver must be a valid address',
          });
        },
        message: 'Client receiver must be a valid address',
      }),
    provider: Yup.string()
      .required()
      .test({
        name: 'providerIsAddress',
        test: (v, { createError }) => {
          if (!!v && isAddress(v)) return true;
          return createError({
            path: 'provider',
            message: 'Provider must be a valid address',
          });
        },
      }),
    providerReceiver: Yup.string()
      .optional()
      .test({
        name: 'providerReceiverIsAddress',
        test: (v, { createError }) => {
          if (!v || isAddress(v)) return true;
          return createError({
            path: 'providerReceiver',
            message: 'Provider receiver must be a valid address',
          });
        },
        message: 'Provider receiver must be a valid address',
      }),
    resolverType: Yup.string()
      .required()
      .oneOf(['kleros', 'custom', 'lexdao', 'smart-invoice']),
    resolverAddress: Yup.string().when('resolverType', (r, localSchema) => {
      if (_.first(r) !== 'custom') return localSchema;
      return localSchema
        .required('Custom resolver address is required')
        .test((value: string) => isAddress(value));
    }),
    klerosCourt: Yup.number().when('resolverType', (r, localSchema) => {
      if (_.first(r) !== 'kleros') return localSchema;
      return localSchema.required('Kleros court is required').oneOf([1, 2, 3]);
    }),
    isResolverTermsChecked: Yup.boolean().when(
      'resolverType',
      (r, localSchema) => {
        if (!isKnownResolver(_.first(r), chainId)) return localSchema;
        return localSchema.oneOf(
          [true],
          "Must accept resolver's terms of service",
        );
      },
    ),
  });

export const instantPaymentSchema = Yup.object().shape({
  client: Yup.string()
    .required('Client address is required')
    .test({
      name: 'clientIsAddress',
      test: (v, { createError }) => {
        if (!!v && isAddress(v)) return true;
        return createError({
          path: 'client',
          message: 'Client must be a valid address',
        });
      },
    }),
  provider: Yup.string()
    .required('Provider address is required')
    .test({
      name: 'providerIsAddress',
      test: (v, { createError }) => {
        if (!!v && isAddress(v)) return true;
        return createError({
          path: 'provider',
          message: 'Provider must be a valid address',
        });
      },
    }),
  token: Yup.string(),
  paymentDue: Yup.number(),
  deadline: Yup.date(),
  lateFee: Yup.string(),
  lateFeeTimeInterval: Yup.string(),
});

export const addMilestonesSchema = Yup.object().shape({
  milestones: Yup.array()
    .min(1, 'At least one milestone is required!')
    .of(
      Yup.object().shape({
        value: Yup.string().required('Milestone Amount is required'),
        title: Yup.string().optional(),
        description: Yup.string().optional(),
      }),
    ),
  document: Yup.string().test({
    name: 'documentIsURL',
    test: (v, { createError }) => {
      if (!v || isValidURL(v)) return true;
      return createError({
        path: 'document',
        message: 'Project document must be a valid URL',
      });
    },
  }),
});

export const resolveFundsSchema = Yup.object().shape({
  description: Yup.string().required('Project description is required'),
  document: Yup.string().test({
    name: 'documentIsURL',
    test: (v, { createError }) => {
      if (!v || isValidURL(v)) return true;
      return createError({
        path: 'document',
        message: 'Project document must be a valid URL',
      });
    },
  }),
  clientAward: Yup.number().required('Client award is required'),
  providerAward: Yup.number().required('Provider award is required'),
  resolverAward: Yup.number().required('Resolver award is required'),
});

export const lockFundsSchema = Yup.object().shape({
  description: Yup.string().required('Project description is required'),
  document: Yup.string().test({
    name: 'documentIsURL',
    test: (v, { createError }) => {
      if (!v || isValidURL(v)) return true;
      return createError({
        path: 'document',
        message: 'Project document must be a valid URL',
      });
    },
  }),
});

export const escrowPaymentsSchema = Yup.object().shape({
  milestones: Yup.array()
    .min(1, 'At least one milestone is required!')
    .of(
      Yup.object().shape({
        value: Yup.string().required('Milestone Amount is required'),
        title: Yup.string().optional(),
        description: Yup.string().optional(),
      }),
    ),
  token: Yup.string().required('Token is required'),
});

export const projectDetailsSchema = Yup.object().shape({
  title: Yup.string().required('Project title is required'),
  description: Yup.string().required('Project description is required'),
  document: Yup.string().test({
    name: 'documentIsURL',
    test: (v, { createError }) => {
      if (!v || isValidURL(v)) return true;
      return createError({
        path: 'document',
        message: 'Project document must be a valid URL',
      });
    },
  }),
  startDate: Yup.date().required('Start Date is required'),
  endDate: Yup.date()
    .required('End Date is required')
    .min(Yup.ref('startDate'), 'End Date must be after Start Date'),
  // ideally could dynamically choose these. Setting a default covers this largely
  deadline: Yup.date().min(
    Yup.ref('endDate'),
    'Deadline must be after End Date',
  ),
  safetyValveDate: Yup.date().when(['endDate'], (endDate, schema) => {
    return schema.min(
      sevenDaysFromDate(endDate.toString()),
      'Safety Valve Date must be at least 7 days after End Date',
    );
  }),
});

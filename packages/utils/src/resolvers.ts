import _ from 'lodash';
import { isAddress } from 'viem';
import * as Yup from 'yup';

import { sevenDaysFromDate } from './date';
import { isKnownResolver } from './helpers';

export const escrowDetailsSchema = (chainId: number) =>
  Yup.object().shape({
    client: Yup.string()
      .required('Client address is required')
      .test({
        name: 'clientIsAddress',
        test: (v, { createError }) => {
          if (!!v && isAddress(v)) return true;
          // console.log('client not address');

          // TODO having trouble surfacing the custom error here
          return createError({
            path: 'client',
            message: 'Client must be a valid address',
          });
        },
      })
      .when('provider', (p, localSchema) => {
        // console.log('client resolver', p);
        if (!p) return localSchema;

        return localSchema.test({
          name: 'clientNotProvider',
          test: (v, { createError }) => {
            if (_.toLower(v) !== _.toLower(_.first(p))) return true;

            // console.log(_.toLower(v), _.toLower(_.first(p)));
            // TODO having trouble surfacing the custom error here
            return createError({
              path: 'client',
              message: 'Client cannot be same as provider',
            });
          },
        });
      }),
    provider: Yup.string()
      .required()
      .test({
        name: 'providerIsAddress',
        test: (v, { createError }) => {
          if (!!v && isAddress(v)) return true;
          // console.log('provider not address');

          return createError({
            path: 'provider',
            message: 'Provider must be a valid address',
          });
        },
      }),
    resolver: Yup.string().required(),
    customResolver: Yup.string().when('resolver', (r, localSchema) => {
      if (_.first(r) !== 'custom') return localSchema;
      return localSchema
        .required('Custom resolver address is required')
        .test((value: string) => isAddress(value));
    }),
    klerosCourt: Yup.number(), // TODO: add custom validator
    resolverTerms: Yup.boolean().when('resolver', (r, localSchema) => {
      if (!isKnownResolver(_.first(r), chainId)) return localSchema;
      return localSchema.oneOf(
        [true],
        "Must accept resolver's terms of service",
      );
    }),
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

export const escrowPaymentsSchema = Yup.object().shape({
  milestones: Yup.array()
    .min(1, 'At least one milestone is required!')
    .of(
      Yup.object().shape({
        value: Yup.string().required('Milestone Amount is required'),
      }),
    ),
  token: Yup.string().required('Token is required'),
});

export const projectDetailsSchema = Yup.object().shape({
  projectName: Yup.string().required('Project Name is required'),
  projectDescription: Yup.string().required('Project Description is required'),
  projectAgreement: Yup.string().url('Agreement must be a valid URL'),
  startDate: Yup.date().required('Start Date is required'),
  endDate: Yup.date().required('End Date is required'),
  // ideally could dynamically choose these. Setting a default covers this largely
  deadline: Yup.date(),
  safetyValveDate: Yup.date().when('endDate', (endDate, schema) => {
    return schema.min(
      sevenDaysFromDate(endDate.toString()),
      'Safety Valve Date must be at least 7 days after End Date',
    );
  }),
});

import {
  Box,
  Button,
  // DatePicker,
  Flex,
  Grid,
  Link,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ESCROW_STEPS } from '@smart-invoice/constants';
import { FormInvoice } from '@smart-invoice/types';
import { Checkbox, Input, Select } from '@smart-invoice/ui';
import {
  getResolverInfo,
  getResolvers,
  getResolverString,
  isKnownResolver,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { Hex, isAddress } from 'viem';
import { useChainId } from 'wagmi';
import * as Yup from 'yup';

export function EscrowDetailsForm({
  invoiceForm,
  updateStep,
}: {
  invoiceForm: UseFormReturn;
  updateStep: (i?: number) => void;
}) {
  const chainId = useChainId();
  const { watch, setValue } = invoiceForm;
  const { provider, client, resolver, customResolver, resolverTerms } = watch();

  // TODO having trouble surfacing the error here
  const schema = useMemo(
    () =>
      Yup.object().shape({
        client: Yup.string()
          .required('Client address is required')
          .test({
            name: 'clientIsAddress',
            test: (v, { createError }) => {
              if (!!v && isAddress(v)) return true;
              console.log('client not address');

              return createError({
                path: 'client',
                message: 'Client must be a valid address',
              });
            },
          })
          .when('provider', (p, localSchema) => {
            console.log('client resolver', p);
            if (!p) return localSchema;

            return localSchema.test({
              name: 'clientNotProvider',
              test: (v, { createError }) => {
                if (_.toLower(v) !== _.toLower(_.first(p))) return true;

                console.log(_.toLower(v), _.toLower(_.first(p)));
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
              console.log('provider not address');

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
        resolverTerms: Yup.boolean().when('resolver', (r, localSchema) => {
          if (!isKnownResolver(_.first(r), chainId)) return localSchema;
          return localSchema.oneOf(
            [true],
            "Must accept resolver's terms of service",
          );
        }),
      }),
    [chainId],
  );

  const localForm = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      client,
      provider,
      customResolver,
      resolverTerms,
    },
  });
  const {
    handleSubmit,
    setValue: localSetValue,
    watch: localWatch,
    formState: { isValid, errors },
  } = localForm;
  console.log(errors, isValid);

  const onSubmit = (values: Partial<FormInvoice>) => {
    setValue('client', values?.client);
    setValue('provider', values?.provider);
    setValue('resolver', values?.resolver);
    setValue('customResolver', values?.customResolver);
    setValue('resolverTerms', values?.resolverTerms);

    updateStep();
  };

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  const RESOLVERS = useMemo(() => getResolvers(chainId), [chainId]);
  const localResolver = localWatch('resolver');

  useEffect(() => {
    // set initial local values for select
    localSetValue('resolver', resolver || _.first(RESOLVERS));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4} w="100%">
        <Stack spacing={4}>
          <Input
            label="Client Address"
            tooltip="This is the wallet address your client uses to access the invoice, pay with, & release escrow funds with. It's essential your client has control of this address."
            placeholder="0x..."
            name="client"
            localForm={localForm}
            registerOptions={{ required: true }}
          />
        </Stack>

        <Flex>
          <Input
            label="Service Provider Address"
            tooltip="This is the address of the recipient/provider. It's how you access this invoice & where you'll receive funds released from escrow. It's essential you have control of this address."
            placeholder="0x..."
            name="provider"
            localForm={localForm}
            registerOptions={{ required: true }}
          />
        </Flex>

        <Stack>
          <Select
            name="resolver"
            label="Arbitration Provider"
            localForm={localForm}
          >
            {RESOLVERS.map((res: string) => (
              <option key={res} value={res}>
                {getResolverInfo(res as Hex, chainId).name}
              </option>
            ))}
            <option value="custom">Custom</option>
          </Select>
          {localResolver === 'custom' ||
          !isKnownResolver(localResolver as Hex, chainId) ? (
            <Input
              name="customResolver"
              tooltip="This arbitrator will be used in case of dispute."
              label="Arbitration Provider Address"
              placeholder="0x..."
              localForm={localForm}
            />
          ) : (
            <Checkbox
              name="resolverTerms"
              localForm={localForm}
              options={[
                <Text>
                  {`I agree to ${getResolverString(localResolver as Hex, chainId)}`}
                  &apos;s{' '}
                  <Link
                    href={
                      getResolverInfo(localResolver as Hex, chainId)?.termsUrl
                    }
                    isExternal
                    textDecor="underline"
                  >
                    terms of service
                  </Link>
                </Text>,
              ]}
            />
          )}
        </Stack>

        <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
          <Button
            type="submit"
            isDisabled={!isValid}
            textTransform="uppercase"
            size={buttonSize}
            fontWeight="bold"
          >
            Next: {ESCROW_STEPS[2].next}
          </Button>
        </Grid>
      </Stack>
    </Box>
  );
}

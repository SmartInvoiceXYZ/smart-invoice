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

export const sevenDaysFromNow = () => {
  const localDate = new Date();
  localDate.setDate(localDate.getDate() + 7);
  return localDate;
};

export function EscrowDetailsForm({
  escrowForm,
  updateStep,
}: {
  escrowForm: UseFormReturn;
  updateStep: (i?: number) => void;
}) {
  const chainId = useChainId();
  const { watch, setValue } = escrowForm;
  const { provider, client, resolver, customResolver, resolverTerms } = watch();

  const schema = useMemo(
    () =>
      Yup.object().shape({
        client: Yup.string().required('Client address is required'),
        // TODO handle nested when for provider !== client
        provider: Yup.string().required(),
        resolver: Yup.string().required(),
        customResolver: Yup.string().when('resolver', (r, localSchema) => {
          console.log(r, localSchema);
          if (_.first(r) !== 'custom') return localSchema;
          return localSchema
            .required('Custom resolver address is required')
            .test((value: string) => isAddress(value));
        }),
        resolverTerms: Yup.boolean().when('resolver', (r, localSchema) => {
          if (!isKnownResolver(_.first(r), chainId)) return localSchema;
          return localSchema.oneOf([true], 'Field must be checked');
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
    formState: { isValid },
  } = localForm;

  // values: Partial<Invoice>
  const onSubmit = (values: any) => {
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

  console.log(localResolver, !isKnownResolver(localResolver as Hex, chainId));

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

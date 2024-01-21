import {
  Box,
  Button,
  Checkbox,
  // Checkbox,
  // DatePicker,
  Flex,
  Grid,
  Link,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ESCROW_STEPS, SUPPORTED_NETWORKS } from '@smart-invoice/constants';
import { Invoice } from '@smart-invoice/graphql';
import { Input, Select } from '@smart-invoice/ui';
import {
  getResolverInfo,
  getResolvers,
  getResolverString,
  isKnownResolver,
} from '@smart-invoice/utils';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { Hex } from 'viem';
import { useChainId } from 'wagmi';
import * as Yup from 'yup';

export const sevenDaysFromNow = () => {
  const localDate = new Date();
  localDate.setDate(localDate.getDate() + 7);
  return localDate;
};

const schema = Yup.object().shape({
  client: Yup.string().required('Client address is required'),
  // TODO handle nested when for provider !== client
  provider: Yup.string().required(),
  resolver: Yup.string().required(),
  customResolver: Yup.string(),
  // customResolver: Yup.string().when('resolver', {
  //   is: (resolver: string) => resolver === 'custom',
  //   then: Yup.string().required('Custom resolver address is required'),
  // }),
});

export function EscrowDetailsForm({
  escrowForm,
  updateStep,
}: {
  escrowForm: UseFormReturn;
  updateStep: (i?: number) => void;
}) {
  const chainId = useChainId();
  const { watch, setValue } = escrowForm;
  const { provider, client, resolver, customResolver } = watch();
  const localForm = useForm({
    resolver: yupResolver(schema),
  });
  const {
    handleSubmit,
    setValue: localSetValue,
    watch: localWatch,
  } = localForm;

  // values: Partial<Invoice>
  const onSubmit = (values: any) => {
    setValue('client', values?.client);
    setValue('provider', values?.provider);
    setValue('resolver', values?.resolver);
    setValue('customResolver', values?.customResolver);

    updateStep();
  };

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  const RESOLVERS = useMemo(() => getResolvers(chainId), [chainId]);
  const localResolver = localWatch('resolver');

  useEffect(() => {
    // set initial local values
    localSetValue('client', client || '');
    if (provider) localSetValue('provider', provider);
    localSetValue('resolver', resolver || _.first(RESOLVERS));
    if (customResolver) localSetValue('customResolver', customResolver);

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
          <Box w="50%">
            {/* <DatePicker
              label="Safety Valve Date"
              name="safetyValveDate"
              tooltip="The funds can be withdrawn by the client after 00:00:00 GMT on this date"
              localForm={localForm}
            /> */}
          </Box>
        </Flex>

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

        <Flex>
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
              localForm={localForm}
            />
          ) : (
            <Checkbox
              colorScheme="blue"
              size="lg"
              fontSize="1rem"
              color="#323C47"
              borderColor="lightgrey"
            >
              {`I agree to ${getResolverString(localResolver as Hex, chainId)} `}

              <Link
                href={getResolverInfo(localResolver as Hex, chainId)?.termsUrl}
                isExternal
                textDecor="underline"
              >
                terms of service
              </Link>
            </Checkbox>
          )}
        </Flex>

        <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
          <Button
            type="submit"
            // isDisabled={!nextStepEnabled}
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

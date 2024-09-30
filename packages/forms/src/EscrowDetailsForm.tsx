import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  Grid,
  Link,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ESCROW_STEPS,
  KLEROS_COURTS,
  KnownResolverType,
} from '@smartinvoicexyz/constants';
import { FormInvoice } from '@smartinvoicexyz/types';
import { Checkbox, Input, Select } from '@smartinvoicexyz/ui';
import {
  escrowDetailsSchema,
  getResolverInfo,
  getResolverString,
  getResolverTypes,
  isKnownResolver,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useChainId } from 'wagmi';

export function EscrowDetailsForm({
  invoiceForm,
  updateStep,
}: {
  invoiceForm: UseFormReturn;
  updateStep: (_i?: number) => void;
}) {
  const chainId = useChainId();
  const { watch, setValue } = invoiceForm;
  const {
    provider,
    client,
    resolverType,
    resolverAddress,
    isResolverTermsChecked,
    klerosCourt,
  } = watch();

  const localForm = useForm({
    resolver: yupResolver(escrowDetailsSchema(chainId)),
    defaultValues: {
      client,
      provider,
      resolverAddress,
      resolverType: resolverType || ('kleros' as KnownResolverType),
      isResolverTermsChecked,
      klerosCourt: klerosCourt || 1,
    },
  });

  const {
    handleSubmit,
    watch: localWatch,
    formState: { isValid },
  } = localForm;

  const onSubmit = (values: Partial<FormInvoice>) => {
    setValue('client', values?.client);
    setValue('provider', values?.provider);
    setValue('resolverType', values?.resolverType);
    setValue('resolverAddress', values?.resolverAddress);
    setValue('isResolverTermsChecked', values?.isResolverTermsChecked);
    setValue('klerosCourt', values?.klerosCourt);
    updateStep();
  };

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  const knownResolverTypes = useMemo(
    () => getResolverTypes(chainId),
    [chainId],
  );
  const { resolverType: lResolverType } = localWatch();
  const localResolverType = lResolverType as KnownResolverType;

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

        <Stack gap={4}>
          <Select
            name="resolverType"
            label="Arbitration Provider"
            localForm={localForm}
          >
            {knownResolverTypes.map(res => (
              <option key={res} value={res}>
                {getResolverInfo(res, chainId)?.name ?? 'Custom'}
              </option>
            ))}
            <option value="custom">Custom</option>
          </Select>

          {localResolverType &&
            getResolverInfo(localResolverType, chainId)?.disclaimer && (
              <Alert bg="yellow.500" borderRadius="md" color="white">
                <AlertIcon color="whiteAlpha.800" />
                <AlertTitle fontSize="sm">
                  {getResolverInfo(localResolverType, chainId)?.disclaimer}
                </AlertTitle>
              </Alert>
            )}

          {localResolverType === 'kleros' && (
            <Select
              name="klerosCourt"
              tooltip="This kleros court will be used in case of dispute."
              label="Kleros Court"
              localForm={localForm}
            >
              {KLEROS_COURTS.map((court: { id: number; name: string }) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </Select>
          )}

          {localResolverType === 'custom' ||
          !isKnownResolver(localResolverType, chainId) ? (
            <Input
              name="resolverAddress"
              tooltip="This arbitrator will be used in case of dispute."
              label="Arbitration Provider Address"
              placeholder="0x..."
              localForm={localForm}
            />
          ) : (
            <Checkbox
              name="isResolverTermsChecked"
              localForm={localForm}
              options={[
                <Text>
                  {`I agree to ${getResolverString(localResolverType, chainId)}`}
                  &apos;s{' '}
                  <Link
                    href={getResolverInfo(localResolverType, chainId)?.termsUrl}
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

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Checkbox as ChakraCheckbox,
  Flex,
  Grid,
  Icon,
  Link,
  Stack,
  Text,
  Tooltip,
  useBreakpointValue,
} from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ESCROW_STEPS,
  KLEROS_COURTS,
  KnownResolverType,
} from '@smartinvoicexyz/constants';
import { FormInvoice } from '@smartinvoicexyz/types';
import { Checkbox, InfoOutlineIcon, Input, Select } from '@smartinvoicexyz/ui';
import {
  escrowDetailsSchema,
  getResolverInfo,
  getResolverString,
  getResolverTypes,
  isKnownResolver,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useChainId } from 'wagmi';

export function EscrowDetailsForm({
  invoiceForm,
  updateStep,
}: {
  invoiceForm: UseFormReturn;
  updateStep: (_i?: number) => void;
}) {
  const [isClientReceiverChecked, setIsClientReceiverChecked] = useState(false);
  const [isProviderReceiverChecked, setIsProviderReceiverChecked] =
    useState(false);

  const chainId = useChainId();
  const { watch, setValue } = invoiceForm;
  const {
    provider,
    providerReceiver,
    client,
    clientReceiver,
    resolverType,
    resolverAddress,
    isResolverTermsChecked,
    klerosCourt,
  } = watch();

  const localForm = useForm({
    resolver: yupResolver(escrowDetailsSchema(chainId)),
    defaultValues: {
      client,
      clientReceiver,
      provider,
      providerReceiver,
      resolverAddress,
      resolverType: resolverType || ('kleros' as KnownResolverType),
      isResolverTermsChecked,
      klerosCourt: klerosCourt || 1,
    },
  });

  const { setValue: setLocalValue } = localForm;

  useEffect(() => {
    if (providerReceiver) {
      setIsProviderReceiverChecked(true);
    }
    if (clientReceiver) {
      setIsClientReceiverChecked(true);
    }
  }, [providerReceiver, clientReceiver]);

  const {
    handleSubmit,
    watch: localWatch,
    formState: { isValid },
  } = localForm;

  const onSubmit = (values: Partial<FormInvoice>) => {
    setValue('client', values?.client);
    setValue('clientReceiver', values?.clientReceiver);
    setValue('provider', values?.provider);
    setValue('providerReceiver', values?.providerReceiver);
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
            tooltip="This is the wallet address your client uses to access the invoice, pay with, & release escrow funds. Ensure your client has full control of this address."
            placeholder="0x..."
            name="client"
            localForm={localForm}
            registerOptions={{ required: true }}
          />
        </Stack>
        <Stack spacing={4}>
          <Flex gap={2}>
            <ChakraCheckbox
              onChange={e => {
                setIsClientReceiverChecked(e.target.checked);
                if (!e.target.checked) {
                  setLocalValue('clientReceiver', undefined);
                }
              }}
              isChecked={isClientReceiverChecked}
            >
              Use a separate receiver address for the client?
            </ChakraCheckbox>
            <Tooltip
              label="(Optional) If the invoice expires or a dispute results in a refund, any returned funds will be sent to this address instead of the client's controlling address."
              shouldWrapChildren
              hasArrow
              placement="end"
            >
              <Icon
                as={InfoOutlineIcon}
                boxSize={3}
                color="blue.500"
                bg="white"
                borderRadius="full"
              />
            </Tooltip>
          </Flex>
        </Stack>
        {isClientReceiverChecked && (
          <Stack spacing={4}>
            <Input
              label="Client Receiver Address"
              placeholder="0x..."
              name="clientReceiver"
              localForm={localForm}
              registerOptions={{ required: true }}
            />
          </Stack>
        )}

        <Stack spacing={4}>
          <Input
            label="Service Provider Address"
            tooltip="This is your controlling address. You use it to access this invoice, manage transactions, and receive funds released from escrow. Ensure you have full control over this address."
            placeholder="0x..."
            name="provider"
            localForm={localForm}
            registerOptions={{ required: true }}
          />
        </Stack>
        <Stack spacing={4}>
          <Flex gap={2}>
            <ChakraCheckbox
              onChange={e => {
                setIsProviderReceiverChecked(e.target.checked);
                if (!e.target.checked) {
                  setLocalValue('providerReceiver', undefined);
                }
              }}
              isChecked={isProviderReceiverChecked}
            >
              Use a separate receiver address for the provider?
            </ChakraCheckbox>
            <Tooltip
              label="(Optional) If you want funds received at a different address than your controlling address, enter it here. This is where released funds will be sent."
              shouldWrapChildren
              hasArrow
              placement="end"
            >
              <Icon
                as={InfoOutlineIcon}
                boxSize={3}
                color="blue.500"
                bg="white"
                borderRadius="full"
              />
            </Tooltip>
          </Flex>
        </Stack>
        {isProviderReceiverChecked && (
          <Stack spacing={4}>
            <Input
              label="Service Provider Receiver Address"
              placeholder="0x..."
              name="providerReceiver"
              localForm={localForm}
              registerOptions={{ required: true }}
            />
          </Stack>
        )}

        <Stack gap={4}>
          <Select
            name="resolverType"
            label="Arbitration Provider"
            localForm={localForm}
          >
            {knownResolverTypes.map(res => (
              <option key={res} value={res}>
                {getResolverInfo(res, chainId).name}
              </option>
            ))}
            <option value="custom">Custom</option>
          </Select>

          {localResolverType &&
            getResolverInfo(localResolverType, chainId)?.disclaimer && (
              <Alert bg="yellow.500" borderRadius="md" color="white">
                <AlertIcon color="whiteAlpha.800" />
                <Box>
                  <AlertTitle fontSize="sm">
                    {getResolverInfo(localResolverType, chainId)?.disclaimer}
                  </AlertTitle>
                  {localResolverType === 'kleros' && (
                    <AlertDescription fontSize="sm">
                      Smart Invoice will only escalate claims to Kleros that are
                      linked to smart escrows holding tokens with a minimum
                      value of 1000 USD at the time of locking the funds.
                    </AlertDescription>
                  )}
                </Box>
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

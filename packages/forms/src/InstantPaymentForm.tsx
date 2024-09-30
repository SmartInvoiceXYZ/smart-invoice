import { Button, Grid, SimpleGrid, Stack } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  INSTANT_STEPS,
  LATE_FEE_INTERVAL_OPTIONS,
} from '@smartinvoicexyz/constants';
import { useFetchTokens } from '@smartinvoicexyz/hooks';
import { IToken } from '@smartinvoicexyz/types';
import {
  Input,
  NumberInput,
  Select,
  useMediaStyles,
} from '@smartinvoicexyz/ui';
import {
  getWrappedNativeToken,
  instantPaymentSchema,
  oneMonthFromNow,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useChainId } from 'wagmi';

export type InstantPaymentFormProps = {
  invoiceForm: UseFormReturn;
  updateStep: () => void;
};

export function InstantPaymentForm({
  invoiceForm,
  updateStep,
}: InstantPaymentFormProps) {
  const chainId = useChainId();

  const { data: tokens } = useFetchTokens();

  const TOKENS = useMemo(
    // eslint-disable-next-line eqeqeq
    () => (tokens ? _.filter(tokens, t => t.chainId == chainId) : []),
    [chainId, tokens],
  ) as IToken[];

  const nativeWrappedToken = getWrappedNativeToken(chainId) || '';

  const { watch, setValue } = invoiceForm;
  const { client, provider, paymentDue, lateFee, token, lateFeeTimeInterval } =
    watch();

  const localForm = useForm({
    resolver: yupResolver(instantPaymentSchema),
    defaultValues: {
      client,
      provider,
      paymentDue,
      deadline: oneMonthFromNow(),
      lateFee,
      token: token || nativeWrappedToken.toLowerCase(),
      lateFeeTimeInterval:
        lateFeeTimeInterval ||
        _.toString(_.first(LATE_FEE_INTERVAL_OPTIONS)?.value),
    },
  });
  const {
    handleSubmit,
    formState: { isValid },
  } = localForm;

  const { primaryButtonSize } = useMediaStyles();

  const onSubmit = (values: unknown) => {
    setValue('client', _.get(values, 'client'));
    setValue('provider', _.get(values, 'provider'));
    setValue('token', _.get(values, 'token'));
    setValue('paymentDue', _.get(values, 'paymentDue'));
    setValue('deadline', _.get(values, 'deadline'));
    setValue('lateFee', _.get(values, 'lateFee'));
    setValue('lateFeeTimeInterval', _.get(values, 'lateFeeTimeInterval'));

    updateStep?.();
  };

  return (
    <Stack as="form" w="100%" spacing="1rem" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Client Address"
        name="client"
        placeholder="0x..."
        tooltip="This is the wallet address your client uses to access the invoice, pay with, & release escrow funds with. It's essential your client has control of this address. (Do NOT use a multi-sig address)."
        registerOptions={{ required: true }}
        localForm={localForm}
      />

      <Input
        label="Service Provider Address"
        name="provider"
        placeholder="0x..."
        tooltip="This is the address of the recipient/provider. It's how you access this invoice & where you'll receive funds released from escrow. It's essential you have control of this address. (Do NOT use a multi-sig address)."
        registerOptions={{ required: true }}
        localForm={localForm}
      />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} alignItems="end">
        <NumberInput
          name="paymentDue"
          label="Total Payment Due"
          variant="outline"
          placeholder="0.00"
          tooltip="This is the total payment for the entire invoice. This number is not based on fiat, but rather the number of tokens you'll receive in your chosen cryptocurrency. (e.g. 7.25 WETH, 100 USDC, etc)."
          registerOptions={{ required: true }}
          w="100%"
          localForm={localForm}
        />
        <Select
          name="token"
          required="required"
          tooltip="This is the cryptocurrency you'll receive payment in. The network your wallet is connected to determines which tokens display here. (If you change your wallet network now, you'll be forced to start the invoice over)."
          localForm={localForm}
        >
          {_.map(TOKENS, t => (
            <option value={t.address.toLowerCase()} key={t.address}>
              {`${t.name} (${t.symbol})`}
            </option>
          ))}
        </Select>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} alignItems="end">
        <NumberInput
          name="lateFee"
          label="Late Fee"
          placeholder="0.00"
          tooltip="A fee imposed if the client does not pay by the deadline."
          localForm={localForm}
          w="100%"
        />
        <Select
          name="lateFeeTimeInterval"
          tooltip="The time interval in which the late fee will be charged past the deadline continuously until paid off."
          localForm={localForm}
        >
          {LATE_FEE_INTERVAL_OPTIONS.map(interval => (
            <option value={interval.value} key={interval.value}>
              {interval.label}
            </option>
          ))}
        </Select>
      </SimpleGrid>

      <Grid templateColumns="1fr" gap="1rem" w="100%" marginTop="20px">
        <Button
          type="submit"
          isDisabled={!isValid}
          textTransform="uppercase"
          size={primaryButtonSize}
          fontWeight="bold"
        >
          Next: {INSTANT_STEPS[2].next}
        </Button>
      </Grid>
    </Stack>
  );
}

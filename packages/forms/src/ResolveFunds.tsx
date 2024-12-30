import { Button, Heading, Stack, Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  FormResolve,
  QUERY_KEY_INVOICE_DETAILS,
  useResolve,
} from '@smartinvoicexyz/hooks';
import { InvoiceDetails } from '@smartinvoicexyz/types';
import {
  LinkInput,
  NumberInput,
  Textarea,
  TokenDescriptor,
  useToast,
} from '@smartinvoicexyz/ui';
import { resolveFundsSchema } from '@smartinvoicexyz/utils';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { formatUnits } from 'viem';

export function ResolveFunds({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetails;
  onClose: () => void;
}) {
  const { resolutionRate, tokenBalance, tokenMetadata, isLocked } = _.pick(
    invoice,
    ['resolutionRate', 'tokenBalance', 'tokenMetadata', 'isLocked'],
  );

  const toast = useToast();
  const localForm = useForm<FormResolve>({
    resolver: yupResolver(resolveFundsSchema),
  });
  const { watch, handleSubmit, setValue } = localForm;

  const resolverAward = useMemo(() => {
    if (!resolutionRate || resolutionRate === BigInt(0) || !tokenBalance) {
      return 0;
    }
    if (tokenBalance.value === BigInt(0)) {
      return 0;
    }
    return _.toNumber(
      formatUnits(
        tokenBalance.value / resolutionRate,
        tokenBalance.decimals ?? 18,
      ),
    );
  }, [tokenBalance, resolutionRate]);

  const availableFunds = useMemo(
    () =>
      _.toNumber(
        formatUnits(
          tokenBalance?.value ?? BigInt(0),
          tokenBalance?.decimals ?? 18,
        ),
      ) - resolverAward,
    [tokenBalance?.value, resolverAward],
  );

  const description = watch('description');

  const queryClient = useQueryClient();

  const onTxSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY_INVOICE_DETAILS],
    });
    onClose();
  };

  const { writeAsync: resolve, isLoading } = useResolve({
    invoice,
    localForm,
    onTxSuccess,
    toast,
  });

  const onSubmit = async () => {
    await resolve?.();
  };

  useEffect(() => {
    if (availableFunds > 0) {
      setValue('clientAward', availableFunds);
      setValue('providerAward', 0);
      setValue('resolverAward', resolverAward);
    }
  }, [availableFunds, resolverAward]);

  if (!isLocked) {
    return (
      <Stack
        w="100%"
        spacing="1rem"
        as="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Heading
          mb="1rem"
          as="h3"
          fontSize="2xl"
          transition="all ease-in-out .25s"
          _hover={{ cursor: 'pointer', color: 'raid' }}
        >
          Resolve Dispute
        </Heading>
        <Text textAlign="center" fontSize="sm" mb="1rem">
          Invoice is not locked
        </Text>
        <Button
          onClick={onClose}
          variant="solid"
          textTransform="uppercase"
          w="100%"
        >
          Close
        </Button>
      </Stack>
    );
  }

  return (
    <Stack as="form" w="100%" spacing="1rem" onSubmit={handleSubmit(onSubmit)}>
      <Heading
        mb="1rem"
        as="h3"
        fontSize="2xl"
        transition="all ease-in-out .25s"
        _hover={{ cursor: 'pointer', color: 'raid' }}
      >
        Resolve Dispute
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem">
        {`You'll need to distribute the total balance of ${formatUnits(
          tokenBalance?.value ?? BigInt(0),
          tokenBalance?.decimals ?? 18,
        )} ${tokenMetadata?.symbol} between the client and provider, excluding the ${
          resolutionRate === BigInt(0) || !resolutionRate
            ? '0'
            : BigInt(100) / resolutionRate
        }% arbitration fee which you shall receive.`}
      </Text>

      <Textarea
        name="description"
        tooltip="Here you may explain your reasoning behind the resolution"
        label="Resolution Comments"
        placeholder="Resolution Comments"
        localForm={localForm}
        registerOptions={{ required: true, maxLength: 10000 }}
      />

      <LinkInput
        name="document"
        label="Resolution link"
        tooltip="A URL linking to more details for this resolution. This is optional."
        placeholder="github.com/AcmeAcademy/buidler"
        localForm={localForm}
      />

      <NumberInput
        name="clientAward"
        label="Client Award"
        localForm={localForm}
        placeholder="Client Award"
        registerOptions={{
          onChange: ({ target: { value } }) => {
            if (value > availableFunds) {
              setValue('clientAward', availableFunds);
              setValue('providerAward', 0);
            }
            setValue('providerAward', availableFunds - value);
          },
        }}
        rightElement={<TokenDescriptor tokenBalance={tokenBalance} />}
      />
      <NumberInput
        name="providerAward"
        label="Provider Award"
        localForm={localForm}
        placeholder="Provider Award"
        registerOptions={{
          onChange: ({ target: { value } }) => {
            if (value > availableFunds) {
              setValue('providerAward', availableFunds);
              setValue('clientAward', 0);
            }
            setValue('clientAward', availableFunds - value);
          },
        }}
        rightElement={<TokenDescriptor tokenBalance={tokenBalance} />}
      />

      <NumberInput
        name="resolverAward"
        label="Arbitration Fee"
        localForm={localForm}
        isDisabled
        rightElement={<TokenDescriptor tokenBalance={tokenBalance} />}
      />

      <Button
        type="submit"
        isDisabled={
          !resolverAward ||
          resolverAward <= BigInt(0) ||
          !description ||
          !resolve
        }
        textTransform="uppercase"
        variant="solid"
        isLoading={isLoading}
      >
        Resolve
      </Button>
    </Stack>
  );
}

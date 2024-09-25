import { Button, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { useResolve } from '@smartinvoicexyz/hooks';
import {
  NumberInput,
  Textarea,
  TokenDescriptor,
  useToast,
} from '@smartinvoicexyz/ui';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { formatUnits, parseUnits, TransactionReceipt } from 'viem';

// TODO handle onChange for award amounts

export function ResolveFunds({
  invoice,
  onClose,
}: {
  invoice: Partial<InvoiceDetails>;
  onClose: () => void;
}) {
  const { resolutionRate, tokenBalance, tokenMetadata, isLocked } = _.pick(
    invoice,
    ['resolutionRate', 'tokenBalance', 'tokenMetadata', 'isLocked'],
  );

  const toast = useToast();
  const localForm = useForm({});
  const { watch, handleSubmit, setValue } = localForm;

  const resolverAward = useMemo(() => {
    if (
      !resolutionRate ||
      resolutionRate === BigInt(0) ||
      tokenBalance?.value === BigInt(0)
    ) {
      return 0;
    }
    const bal = tokenBalance?.value;
    return bal ? _.toNumber(formatUnits(bal / resolutionRate, 18)) : 0;
  }, [tokenBalance?.value, resolutionRate]);

  const availableFunds =
    _.toNumber(
      formatUnits(
        tokenBalance?.value ?? BigInt(0),
        tokenBalance?.decimals ?? 18,
      ),
    ) - resolverAward;

  const clientAward = watch('clientAward');
  const providerAward = watch('providerAward');
  const comments = watch('comments');

  const awards = useMemo(
    () => ({
      client: clientAward ? parseUnits(_.toString(clientAward), 18) : BigInt(0),
      provider: providerAward
        ? parseUnits(_.toString(providerAward), 18)
        : BigInt(0),
      resolver: resolverAward
        ? parseUnits(_.toString(resolverAward), 18)
        : BigInt(0),
    }),
    [clientAward, providerAward, resolverAward],
  );

  const onTxSuccess = (_tx: TransactionReceipt) => {
    // TODO: handle tx success
    // console.log(tx);
    // toast
    // invalidate cache
    // close modal
  };

  const { writeAsync: resolve, isLoading } = useResolve({
    invoice,
    awards,
    comments,
    onTxSuccess,
    toast,
  });

  const onSubmit = async () => {
    // console.log('submitting', awards, comments);

    await resolve?.();
  };

  useEffect(() => {
    if (availableFunds > 0) {
      setValue('clientAward', availableFunds);
      setValue('providerAward', 0);
      setValue('resolverAward', resolverAward);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        name="comments"
        tooltip="Here you may explain your reasoning behind the resolution"
        label="Resolution Comments"
        placeholder="Resolution Comments"
        localForm={localForm}
        registerOptions={{ required: true, maxLength: 10000 }}
      />

      <NumberInput
        name="clientAward"
        label="Client Award"
        localForm={localForm}
        placeholder="Client Award"
        registerOptions={{
          onChange: value => {
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
          onChange: value => {
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

      {isLoading && <Spinner size="xl" />}

      <Button
        type="submit"
        isDisabled={
          !resolverAward || resolverAward <= BigInt(0) || !comments || !resolve
        }
        textTransform="uppercase"
        variant="solid"
      >
        Resolve
      </Button>

      {/* {transaction && (
            <Text textAlign='center' fontSize='sm'>
              Follow your transaction{' '}
              <Link
                href={getTxLink(chainId, transaction.hash)}
                isExternal
                color='primary.300'
                textDecoration='underline'
              >
                here
              </Link>
            </Text>
          )} */}
    </Stack>
  );
}

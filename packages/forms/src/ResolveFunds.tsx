import {
  Button,
  Heading,
  InputGroup,
  InputRightElement,
  NumberInput,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useResolve } from '@smart-invoice/hooks';
import { Invoice } from '@smart-invoice/graphql';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { formatUnits, parseUnits } from 'viem';
import { useChainId } from 'wagmi';

// TODO handle onChange for award amounts

const ResolveFunds = ({
  invoice,
  balance,
  close,
}: {
  invoice: Invoice;
  balance: bigint;
  close: () => void;
}) => {
  const { resolutionRate, token } = _.pick(invoice, [
    'resolutionRate',
    'token',
  ]);
  const chainId = useChainId();

  const isLocked = true;

  const localForm = useForm({});
  const { watch, handleSubmit, setValue } = localForm;

  const resolverAward = useMemo(() => {
    if (
      !resolutionRate ||
      resolutionRate === BigInt(0) ||
      balance === BigInt(0)
    ) {
      return 0;
    }
    return _.toNumber(formatUnits(balance / resolutionRate, 18));
  }, [balance, resolutionRate]);

  const availableFunds = _.toNumber(formatUnits(balance, 18)) - resolverAward;

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

  const { writeAsync: resolve, isLoading } = useResolve({
    invoice,
    awards,
    comments,
  });

  const onSubmit = async () => {
    // await resolve();
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
      <VStack
        w="100%"
        spacing="1rem"
        as="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Heading
          mb="1rem"
          color="white"
          as="h3"
          fontSize="2xl"
          transition="all ease-in-out .25s"
          _hover={{ cursor: 'pointer', color: 'raid' }}
        >
          Resolve Dispute
        </Heading>
        {/* <Text textAlign='center' fontSize='sm' mb='1rem' fontFamily='texturina'>
          {isLocked
            ? `You’ll need to distribute the total balance of ${formatUnits(
                balance,
                18
              )} ${parseTokenAddress(
                chainId,
                token
              )} between the client and provider, excluding the ${
                resolutionRate === 0 ? '0' : 100 / resolutionRate
              }% arbitration fee which you shall receive.`
            : `Invoice is not locked`}
        </Text> */}
        <Button
          onClick={close}
          variant="solid"
          textTransform="uppercase"
          w="100%"
        >
          Close
        </Button>
      </VStack>
    );
  }

  return (
    <VStack as="form" w="100%" spacing="1rem" onSubmit={handleSubmit(onSubmit)}>
      <Heading
        mb="1rem"
        color="white"
        as="h3"
        fontSize="2xl"
        transition="all ease-in-out .25s"
        _hover={{ cursor: 'pointer', color: 'raid' }}
      >
        Resolve Dispute
      </Heading>
      {/* <Text textAlign='center' fontSize='sm' mb='1rem' fontFamily='texturina'>
        {`You’ll need to distribute the total balance of ${formatUnits(
          balance,
          18
        )} ${parseTokenAddress(
          chainId,
          token
        )} between the client and provider, excluding the ${
          resolutionRate === 0 ? '0' : 100 / resolutionRate
        }% arbitration fee which you shall receive.`}
      </Text> */}

      {/* <Textarea
        name='comments'
        tooltip='Here you may explain your reasoning behind the resolution'
        label='Resolution Comments'
        placeholder='Resolution Comments'
        localForm={localForm}
        maxLength={10000}
      /> */}

      <InputGroup>
        {/* <NumberInput
          name='clientAward'
          label='Client Award'
          localForm={localForm}
          placeholder='Client Award'
          registerOptions={{
            onChange: (value) => {
              if (value > availableFunds) {
                setValue('clientAward', availableFunds);
                setValue('providerAward', 0);
              }
              setValue('providerAward', availableFunds - value);
            },
          }}
        />
        <InputRightElement w='3.5rem' color='yellow'>
          {parseTokenAddress(chainId, token)}
        </InputRightElement> */}
      </InputGroup>
      <InputGroup>
        {/* <NumberInput
          name='providerAward'
          label='Provider Award'
          localForm={localForm}
          placeholder='Provider Award'
          registerOptions={{
            onChange: (value) => {
              if (value > availableFunds) {
                setValue('providerAward', availableFunds);
                setValue('clientAward', 0);
              }
              setValue('clientAward', availableFunds - value);
            },
          }}
        />
        <InputRightElement w='3.5rem' color='yellow'>
          {parseTokenAddress(chainId, token)}
        </InputRightElement> */}
      </InputGroup>
      <InputGroup>
        {/* <NumberInput
          name='resolverAward'
          label='Arbitration Fee'
          localForm={localForm}
          isDisabled
        />
        <InputRightElement w='3.5rem' color='yellow'>
          {parseTokenAddress(chainId, token)}
        </InputRightElement> */}
      </InputGroup>

      {isLoading && <Spinner size="xl" />}

      {true && (
        <Button
          type="submit"
          isDisabled={resolverAward <= BigInt(0) || !comments || !resolve}
          textTransform="uppercase"
          variant="solid"
        >
          Resolve
        </Button>
      )}

      {/* {transaction && (
            <Text color='white' textAlign='center' fontSize='sm'>
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
    </VStack>
  );
};

export default ResolveFunds;

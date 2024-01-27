import {
  Button,
  Heading,
  Spinner,
  Stack,
  Text,
  // Link,
  useToast,
} from '@chakra-ui/react';
import { fetchInvoice, Invoice } from '@smart-invoice/graphql';
import {
  useFetchTokens,
  usePollSubgraph,
  useRelease,
} from '@smart-invoice/hooks';
import { getTokenSymbol } from '@smart-invoice/utils/src';
import _ from 'lodash';
// import { getTokenSymbol } from '@smart-invoice/utils';
import { formatUnits, Hex } from 'viem';
import { useChainId } from 'wagmi';

type ReleaseFundsProp = {
  invoice: Invoice;
  balance: bigint;
};

export const getReleaseAmount = (
  currentMilestone: any,
  amounts: any,
  balance: any,
) => {
  if (
    currentMilestone >= amounts.length ||
    (currentMilestone === amounts.length - 1 &&
      balance.gte(amounts[currentMilestone]))
  ) {
    return balance;
  }
  return BigInt(amounts[currentMilestone]);
};

export function ReleaseFunds({ invoice, balance }: ReleaseFundsProp) {
  const toast = useToast();
  const chainId = useChainId();
  const { data } = useFetchTokens();
  const { tokenData } = _.pick(data, ['tokenData']);

  const { address, currentMilestone, amounts, token, released } = _.pick(
    invoice,
    ['address', 'currentMilestone', 'amounts', 'token', 'released'],
  );

  const waitForRelease = usePollSubgraph({
    label: 'waiting for funds to be released',
    fetchHelper: () => address && fetchInvoice(chainId, address as Hex),
    checkResult: updatedInvoice =>
      released ? updatedInvoice.released > released : false,
  });

  const onSuccess = async () => {
    await waitForRelease();
    // toast.success({ title: 'Funds released successfully' });
  };

  const { writeAsync: releaseFunds, isLoading } = useRelease({
    invoice,
    onSuccess,
  });

  // const pollSubgraph = async () => {
  //   let isSubscribed = true;

  //   const interval = setInterval(async () => {
  //     let inv = await getInvoice(parseInt(chainId), invoice_id);

  //     if (isSubscribed && !!inv) {
  //       if (
  //         utils.formatUnits(inv.released, 18) >
  //         utils.formatUnits(invoice.released, 18)
  //       ) {
  //         isSubscribed = false;
  //         clearInterval(interval);

  //         window.location.reload();
  //       }
  //     }
  //   }, 5000);
  // };

  return (
    <Stack w="100%" spacing="1rem" align="center">
      <Heading
        mb="1rem"
        as="h3"
        fontSize="2xl"
        transition="all ease-in-out .25s"
        _hover={{ cursor: 'pointer', color: 'raid' }}
      >
        Release Funds
      </Heading>
      <Text
        textAlign="center"
        fontSize="sm"
        mb="1rem"
        w="60%"
        color="blackAlpha.800"
      >
        Follow the instructions in your wallet to release funds from escrow to
        the raid party.
      </Text>
      <Stack
        my="2rem"
        px="5rem"
        py="1rem"
        bg="blackAlpha.300"
        borderRadius="0.5rem"
      >
        <Text color="blackAlpha.600" fontSize="0.875rem" textAlign="center">
          Amount To Be Released
        </Text>
        <Text
          color="blue.500"
          fontSize="xl"
          fontWeight="bold"
          textAlign="center"
        >{`${formatUnits(
          getReleaseAmount(currentMilestone, amounts, balance),
          18,
        )} ${getTokenSymbol(chainId, token, tokenData)}`}</Text>
      </Stack>
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
      {isLoading ? (
        <Spinner size="xl" />
      ) : (
        <Button
          onClick={releaseFunds}
          isDisabled={!releaseFunds || isLoading}
          isLoading={isLoading}
          textTransform="uppercase"
          variant="solid"
        >
          Release
        </Button>
      )}
    </Stack>
  );
}

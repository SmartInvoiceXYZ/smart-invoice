import {
  Button,
  Heading,
  Spinner,
  Text,
  // Link,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { fetchInvoice, Invoice } from '@smart-invoice/graphql';
import { usePollSubgraph, useRelease } from '@smart-invoice/hooks';
import _ from 'lodash';
// import { parseTokenAddress } from '@smart-invoice/utils';
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
    <VStack w="100%" spacing="1rem">
      <Heading
        mb="1rem"
        color="white"
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
        color="whiteAlpha.800"
      >
        Follow the instructions in your wallet to release funds from escrow to
        the raid party.
      </Text>
      <VStack my="2rem" px="5rem" py="1rem" bg="black" borderRadius="0.5rem">
        <Text color="primary.200" fontSize="0.875rem" textAlign="center">
          Amount To Be Released
        </Text>
        {/* <Text
          color="yellow.500"
          fontSize="xl"
          fontWeight="bold"
          textAlign="center"
        >{`${formatUnits(
          getReleaseAmount(currentMilestone, amounts, balance),
          18,
        )} ${parseTokenAddress(chainId, token)}`}</Text> */}
      </VStack>
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
    </VStack>
  );
}

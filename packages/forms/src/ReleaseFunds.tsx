import { Button, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import { fetchInvoice, InvoiceDetails } from '@smart-invoice/graphql';
import { usePollSubgraph, useRelease } from '@smart-invoice/hooks';
import { useToast } from '@smart-invoice/ui';
import _ from 'lodash';
import { formatUnits, Hex } from 'viem';
import { useChainId } from 'wagmi';

type ReleaseFundsProp = {
  invoice: InvoiceDetails;
};

// TODO handle release specified/multiple milestones

export const getReleaseAmount = (
  currentMilestone: number | undefined,
  amounts: bigint[] | undefined,
  balance: bigint | undefined,
) => {
  if (
    !currentMilestone ||
    currentMilestone >= _.size(amounts) ||
    (currentMilestone === _.size(amounts) - 1 &&
      balance &&
      amounts &&
      balance > amounts[currentMilestone])
  ) {
    return balance || BigInt(0);
  }
  return amounts ? BigInt(amounts?.[currentMilestone]) : BigInt(0);
};

export function ReleaseFunds({ invoice }: ReleaseFundsProp) {
  const toast = useToast();
  const chainId = useChainId();

  const {
    address,
    currentMilestoneNumber,
    bigintAmounts,
    released,
    tokenBalance,
  } = _.pick(invoice, [
    'address',
    'currentMilestoneNumber',
    'bigintAmounts',
    'released',
    'tokenBalance',
  ]);

  const onTxSuccess = async () => {
    // TODO handle tx success
    toast.success({ title: 'Funds released successfully' });
    // close modal
    // invalidate cache
    // update invoice with new balances
  };

  const { writeAsync: releaseFunds, isLoading } = useRelease({
    invoice,
    onTxSuccess,
    toast,
  });

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
          getReleaseAmount(
            currentMilestoneNumber,
            bigintAmounts,
            tokenBalance?.value,
          ),
          tokenBalance?.decimals || 18,
        )} ${tokenBalance?.symbol}`}</Text>
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

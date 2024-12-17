import { Button, Heading, Stack, Text } from '@chakra-ui/react';
import { TOASTS } from '@smartinvoicexyz/constants';
import { QUERY_KEY_INVOICE_DETAILS, useRelease } from '@smartinvoicexyz/hooks';
import { InvoiceDetails } from '@smartinvoicexyz/types';
import { useToast } from '@smartinvoicexyz/ui';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { formatUnits } from 'viem';

// TODO handle release specified/multiple milestones

export const getReleaseAmount = (
  currentMilestone: number | undefined,
  amounts: bigint[] | undefined,
  balance: bigint | undefined,
) => {
  if (
    _.isUndefined(currentMilestone) ||
    currentMilestone >= _.size(amounts) ||
    // last milestone with extra balance
    (currentMilestone === _.size(amounts) - 1 &&
      balance &&
      amounts &&
      balance > amounts[currentMilestone])
  ) {
    // TODO coordinate useRelease to handle specific milestones
    return balance || BigInt(0);
  }
  return amounts ? BigInt(amounts?.[currentMilestone]) : BigInt(0);
};

export function ReleaseFunds({
  invoice,
  onClose,
}: {
  invoice: Partial<InvoiceDetails>;
  onClose: () => void;
}) {
  const toast = useToast();

  const queryClient = useQueryClient();
  const { currentMilestoneNumber, amounts, tokenBalance } = _.pick(invoice, [
    'currentMilestoneNumber',
    'amounts',
    'tokenBalance',
  ]);

  const onTxSuccess = () => {
    toast.success(TOASTS.useRelease.success);
    // invalidate cache
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY_INVOICE_DETAILS],
    });
    // close modal
    onClose();
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
        Follow the instructions in your wallet to release funds from the escrow
        to provider account.
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
            amounts,
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
      <Button
        onClick={releaseFunds}
        isDisabled={!releaseFunds || isLoading}
        isLoading={isLoading}
        textTransform="uppercase"
        variant="solid"
      >
        Release
      </Button>
    </Stack>
  );
}

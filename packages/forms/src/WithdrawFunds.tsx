import {
  Button,
  Heading,
  // Link,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Invoice } from '@smart-invoice/graphql';
import { useWithdraw } from '@smart-invoice/hooks';
import { getTxLink } from '@smart-invoice/utils';
import { formatUnits } from 'viem';
import { useChainId } from 'wagmi';

export function WithdrawFunds({
  invoice,
  balance,
}: {
  invoice: Invoice;
  balance: bigint;
}) {
  const chainId = useChainId();

  // const onSuccess = () => {
  //   // toast
  //   // close modal
  // };

  const { writeAsync: withdrawFunds, isLoading } = useWithdraw({ invoice });

  return (
    <Stack w="100%" spacing="1rem">
      <Heading
        mb="1rem"
        as="h3"
        fontSize="2xl"
        transition="all ease-in-out .25s"
        _hover={{ cursor: 'pointer', color: 'raid' }}
      >
        Withdraw Funds
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem" w="70%">
        Follow the instructions in your wallet to withdraw remaining funds from
        the escrow.
      </Text>
      <Stack my="2rem" px="5rem" py="1rem" bg="black" borderRadius="0.5rem">
        <Text color="primary.300" fontSize="0.875rem" textAlign="center">
          Amount To Be Withdrawn
        </Text>
        {/* <Text
          color='yellow'
          fontSize='1rem'
          fontWeight='bold'
          textAlign='center'
        >{`${formatUnits(balance, 18)} ${parseTokenAddress(
          chainId,
          invoice?.token
        )}`}</Text> */}
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
      {isLoading && <Spinner size="xl" />}
      <Button
        onClick={withdrawFunds}
        isDisabled={!withdrawFunds}
        variant="solid"
        textTransform="uppercase"
      >
        Withdraw
      </Button>
    </Stack>
  );
}

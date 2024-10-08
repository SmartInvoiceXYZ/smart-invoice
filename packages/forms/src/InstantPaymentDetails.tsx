import { Card, Divider, Flex, Stack, Text } from '@chakra-ui/react';
import { InvoiceDetails } from '@smartinvoicexyz/types';
import _ from 'lodash';
import { formatUnits } from 'viem';

export const InstantPaymentDetails: React.FC<{
  invoice: InvoiceDetails;
}> = ({ invoice }) => {
  const {
    total,
    tokenBalance,
    amountFulfilled,
    deadline,
    deadlineLabel,
    lateFee,
    totalDue,
  } = _.pick(invoice, [
    'client',
    'provider',
    'total',
    'tokenBalance',
    'fulfilled',
    'amountFulfilled',
    'deadline',
    'deadlineLabel',
    'lateFee',
    'totalDue',
  ]);

  let due = BigInt(0);

  if (totalDue && amountFulfilled) {
    if (totalDue > amountFulfilled) {
      due = totalDue - amountFulfilled;
    } else {
      due = BigInt(0);
    }
  }

  return (
    <Card direction="column" py={6} w="100%">
      <Stack w="100%">
        <Stack px={6} spacing={4}>
          {total ? (
            <Flex
              justify="space-between"
              align="center"
              fontWeight="bold"
              fontSize="lg"
            >
              <Text>Amount</Text>

              <Text>{`${formatUnits(total, tokenBalance?.decimals || 18)} ${tokenBalance?.symbol}`}</Text>
            </Flex>
          ) : null}

          {!!lateFee && (
            <Flex
              justify="space-between"
              align="center"
              fontWeight="bold"
              fontSize="lg"
            >
              <Flex direction="column">
                <Text>Late Fee</Text>

                <Text
                  fontSize="x-small"
                  fontWeight="normal"
                  fontStyle="italic"
                  color="grey"
                >
                  {deadline ? deadlineLabel : `Not applicable`}
                </Text>
              </Flex>

              <Text>{`${formatUnits(lateFee, tokenBalance?.decimals || 18)} ${tokenBalance?.symbol}`}</Text>
            </Flex>
          )}

          <Flex
            justify="space-between"
            align="center"
            fontWeight="bold"
            fontSize="lg"
          >
            <Text>Deposited</Text>

            <Text>{`${formatUnits(
              amountFulfilled || BigInt(0),
              tokenBalance?.decimals || 18,
            )} ${tokenBalance?.symbol}`}</Text>
          </Flex>
        </Stack>

        <Divider my="1rem" />

        <Flex
          justify="space-between"
          align="center"
          color="black"
          fontWeight="bold"
          fontSize="lg"
          px={6}
        >
          <Text>
            {amountFulfilled && amountFulfilled > BigInt(0)
              ? 'Remaining'
              : 'Total'}{' '}
            Due
          </Text>
          <Text textAlign="right">{`${formatUnits(
            due,
            tokenBalance?.decimals || 18,
          )} ${tokenBalance?.symbol}`}</Text>
        </Flex>
      </Stack>
    </Card>
  );
};

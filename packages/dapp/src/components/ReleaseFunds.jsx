import {
  Button,
  Heading,
  Link,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { BigNumber, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { getToken, getTxLink, logError } from '../utils/helpers';
import { release } from '../utils/invoice';

export const ReleaseFunds = ({ invoice, balance, close }) => {
  const [loading, setLoading] = useState(false);
  const { provider } = useContext(Web3Context);
  const { currentMilestone, amounts, address, token } = invoice;

  let amount = BigNumber.from(amounts[currentMilestone]);
  amount =
    currentMilestone === amounts.length - 1 && amount.lt(balance)
      ? balance
      : amounts[currentMilestone];

  const { decimals, symbol } = getToken(token);
  const [transaction, setTransaction] = useState();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const send = async () => {
      try {
        setLoading(true);
        const tx = await release(provider, address);
        setTransaction(tx);
        await tx.wait();
        window.location.href = `/invoice/${address}`;
      } catch (releaseError) {
        setLoading(false);
        logError({ releaseError });
      }
    };
    if (!loading && provider && balance && balance.gte(amount)) {
      send();
    }
  }, [amount, address, provider, balance, close, loading]);

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="normal"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
      >
        Release Funds
      </Heading>
      <Text textAlign="center" fontSize="sm" mb="1rem">
        Follow the instructions in your wallet to release funds from escrow to
        the project team.
      </Text>
      <VStack
        className="release-amount"
        my="2rem"
        px="5rem"
        py="1rem"
        bg="black"
        borderRadius="0.5rem"
      >
        <Text color="red.500" fontSize="0.875rem" textAlign="center">
          Amount To Be Released
        </Text>
        <Text
          color="white"
          fontSize="1rem"
          fontWeight="bold"
          textAlign="center"
        >{`${utils.formatUnits(amount, decimals)} ${symbol}`}</Text>
      </VStack>
      {transaction && (
        <Text color="white" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(transaction.hash)}
            isExternal
            color="red.500"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>
      )}
      <Button
        onClick={close}
        variant="outline"
        colorScheme="red"
        textTransform="uppercase"
        size={buttonSize}
        fontFamily="mono"
        fontWeight="normal"
        w="100%"
      >
        Close
      </Button>
    </VStack>
  );
};

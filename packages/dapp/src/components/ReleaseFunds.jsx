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
import {
  getHexChainId,
  getTokenInfo,
  getTxLink,
  logError,
} from '../utils/helpers';
import { release } from '../utils/invoice';

const getReleaseAmount = (currentMilestone, amounts, balance) => {
  if (
    currentMilestone >= amounts.length ||
    (currentMilestone === amounts.length - 1 &&
      balance.gte(amounts[currentMilestone]))
  ) {
    return balance;
  }
  return BigNumber.from(amounts[currentMilestone]);
};

export const ReleaseFunds = ({ invoice, balance, close, tokenData }) => {
  const [loading, setLoading] = useState(false);
  const { chainId, provider } = useContext(Web3Context);
  const { network, currentMilestone, amounts, address, token } = invoice;

  let amount = getReleaseAmount(currentMilestone, amounts, balance);

  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [transaction, setTransaction] = useState();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const send = async () => {
      try {
        setLoading(true);
        const tx = await release(provider, address);
        setTransaction(tx);
        await tx.wait();
        window.location.href = `/invoice/${getHexChainId(network)}/${address}`;
      } catch (releaseError) {
        logError({ releaseError });
        close();
      }
    };
    if (!loading && provider && balance && balance.gte(amount)) {
      send();
    }
  }, [network, amount, address, provider, balance, loading, close]);

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
      <VStack my="2rem" px="5rem" py="1rem" bg="black" borderRadius="0.5rem">
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
            href={getTxLink(chainId, transaction.hash)}
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

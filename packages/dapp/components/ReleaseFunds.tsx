import { Transaction, bigint, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

import {
  Button,
  Flex,
  Heading,
  Link,
  Text,
  Tooltip,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';

import { Web3Context } from '../context/Web3Context';
import { QuestionIcon } from '../icons/QuestionIcon';
import {
  getHexChainId,
  getTokenInfo,
  getTxLink,
  logError,
} from '../utils/helpers';
import { release } from '../utils/invoice';

const getReleaseAmount = (
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

export function ReleaseFunds({ invoice, balance, close, tokenData }: any) {
  const [loading, setLoading] = useState(false);
  const { chain, provider } = useContext(Web3Context);
  const {
    network,
    currentMilestone,
    amounts,
    address,
    token,
    provider: recipient,
  } = invoice;

  const amount = getReleaseAmount(currentMilestone, amounts, balance);

  const { decimals, symbol } = getTokenInfo(chain, token, tokenData);
  const [transaction, setTransaction] = useState<Transaction>();
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
        fontWeight="bold"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
        color="black"
      >
        Release Funds
      </Heading>

      <Text textAlign="center" fontSize="sm" mb="1rem" color="black">
        Follow the instructions in your wallet to release funds from escrow to
        the project team.
      </Text>

      <VStack my="2rem" px="5rem" py="1rem" bg="white" borderRadius="0.5rem">
        <Flex>
          <Text color="black" fontSize="0.875rem" textAlign="center">
            Amount To Be Released
          </Text>

          <Tooltip
            label={`On release, the amount will be sent to ${recipient}`}
            placement="auto-start"
          >
            <QuestionIcon ml=".25rem" boxSize="0.75rem" />
          </Tooltip>
        </Flex>

        <Text
          color="black"
          fontSize="1rem"
          fontWeight="bold"
          textAlign="center"
        >{`${utils.formatUnits(amount, decimals)} ${symbol}`}</Text>
      </VStack>
      {chain && transaction?.hash && (
        <Text color="black" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(chain, transaction?.hash)}
            isExternal
            color="blue"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>
      )}

      <Button
        onClick={close}
        _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
        _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
        color="white"
        backgroundColor="blue.1"
        textTransform="uppercase"
        size={buttonSize}
        fontFamily="mono"
        fontWeight="bold"
        w="100%"
      >
        Close
      </Button>
    </VStack>
  );
}

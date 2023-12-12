import { Transaction, utils } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

import {
  Button,
  Heading,
  Link,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';

import { Web3Context } from '../context/Web3Context';
import {
  getHexChainId,
  getTokenInfo,
  getTxLink,
  logError,
} from '../utils/helpers';
import { withdraw } from '../utils/invoice';

export function WithdrawFunds({ invoice, balance, close, tokenData }: any) {
  const [loading, setLoading] = useState(false);
  const { chain, provider } = useContext(Web3Context);
  const { network, address, token } = invoice;

  const { decimals, symbol } = getTokenInfo(chain, token, tokenData);
  const [transaction, setTransaction] = useState<Transaction>();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const send = async () => {
      try {
        setLoading(true);
        const tx = await withdraw(provider, address);
        setTransaction(tx);
        await tx.wait();
        window.location.href = `/invoice/${getHexChainId(network)}/${address}`;
        setLoading(false);
      } catch (withdrawError) {
        close();
        logError({ withdrawError });
      }
    };
    if (!loading && provider && balance.gte(0)) {
      send();
    }
  }, [network, balance, address, provider, loading, close]);

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="normal"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
      >
        Withdraw Funds
      </Heading>

      <Text textAlign="center" fontSize="sm" mb="1rem">
        Follow the instructions in your wallet to withdraw remaining funds from
        the escrow.
      </Text>

      <VStack my="2rem" px="5rem" py="1rem" bg="black" borderRadius="0.5rem">
        <Text color="red.500" fontSize="0.875rem" textAlign="center">
          Amount To Be Withdrawn
        </Text>

        <Text
          color="white"
          fontSize="1rem"
          fontWeight="bold"
          textAlign="center"
        >{`${utils.formatUnits(balance, decimals)} ${symbol}`}</Text>
      </VStack>
      {chain && transaction?.hash && (
        <Text color="white" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(chain, transaction.hash)}
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
}

import React, { useEffect, useState } from 'react';
import { Hash, formatUnits } from 'viem';
import { useWalletClient } from 'wagmi';

import {
  Button,
  Flex,
  Heading,
  Link,
  Text,
  Tooltip,
  VStack,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react';
import { waitForTransaction } from '@wagmi/core';

import { ChainId } from '../constants/config';
import { QuestionIcon } from '../icons/QuestionIcon';
import { TokenData } from '../types';
import { getTokenInfo, getTxLink, isAddress, logError } from '../utils/helpers';
import { release } from '../utils/invoice';
import { Invoice } from '../graphql/fetchInvoice';

const getReleaseAmount = (
  currentMilestone: number,
  amounts: bigint[],
  balance: bigint,
) => {
  if (
    currentMilestone >= amounts.length ||
    (currentMilestone === amounts.length - 1 &&
      balance > amounts[currentMilestone])
  ) {
    return balance;
  }
  return BigInt(amounts[currentMilestone]);
};

export type ReleaseFundsProps = {
  invoice: Invoice;
  balance: bigint;
  close: () => void;
  tokenData: Record<ChainId, Record<string, TokenData>>;
};

export function ReleaseFunds({
  invoice,
  balance,
  close,
  tokenData,
}: ReleaseFundsProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
  const {
    network,
    currentMilestone,
    amounts,
    address,
    token,
    provider: recipient,
  } = invoice ?? {};
  const validAmounts = amounts?.map(a => BigInt(a));
  const validAddress = isAddress(address);

  const amount = validAmounts
    ? getReleaseAmount(Number(currentMilestone), validAmounts, balance)
    : undefined;

  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [txHash, setTxHash] = useState<Hash>();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const send = async () => {
      if (loading || !walletClient || !chainId || !validAddress) return;
      try {
        setLoading(true);
        const hash = await release(walletClient, validAddress);
        setTxHash(hash);
        const txReceipt = await waitForTransaction({ chainId, hash });
        setLoading(false);
        if (txReceipt.status === 'success') {
          window.location.href = `/invoice/${chainId.toString(16)}/${address}`;
        } else {
          toast({
            status: 'error',
            title: 'Transaction failed',
            description: (
              <Flex direction="row">
                <Heading>Transaction failed</Heading>
                <Text>
                  Transaction {txReceipt.transactionHash} status is '
                  {txReceipt.status}'.
                </Text>
              </Flex>
            ),
            isClosable: true,
            duration: 5000,
          });
        }
      } catch (releaseError) {
        logError({ releaseError });
        close();
      }
    };
    if (amount && balance && balance > amount) {
      send();
    }
  }, [
    network,
    amount,
    address,
    walletClient,
    balance,
    loading,
    close,
    chainId,
    toast,
    validAddress,
  ]);

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
        >
          {amount ? `${formatUnits(amount, decimals)} ${symbol}` : '-'}
        </Text>
      </VStack>
      {chainId && txHash && (
        <Text color="black" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(chainId, txHash)}
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

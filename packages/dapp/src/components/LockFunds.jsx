import {
  Button,
  Flex,
  Heading,
  Link,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { BigNumber, utils } from 'ethers';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { ReactComponent as LockImage } from '../assets/lock.svg';
import { Web3Context } from '../context/Web3Context';
import { AccountLink } from '../shared/AccountLink';
import { OrderedTextarea } from '../shared/OrderedInput';
import {
  getResolverInfo,
  getResolverString,
  getTokenInfo,
  getTxLink,
  isKnownResolver,
  logError,
} from '../utils/helpers';
import { getResolutionRate, lock } from '../utils/invoice';
import { uploadDisputeDetails } from '../utils/ipfs';
import { Loader } from './Loader';

export const LockFunds = ({ invoice, balance }) => {
  const { chainId, provider } = useContext(Web3Context);
  const { address, resolver, token } = invoice;
  const { decimals, symbol } = getTokenInfo(chainId, token);
  const [disputeReason, setDisputeReason] = useState('');

  const [resolutionRate, setResolutionRate] = useState(20);

  useEffect(() => {
    getResolutionRate(provider, resolver).then(setResolutionRate);
  }, [provider, resolver]);

  const fee = `${utils.formatUnits(
    BigNumber.from(balance).div(resolutionRate),
    decimals,
  )} ${symbol}`;

  const [locking, setLocking] = useState(false);
  const [transaction, setTransaction] = useState();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  const lockFunds = useCallback(async () => {
    if (provider && !locking && balance.gt(0) && disputeReason) {
      try {
        setLocking(true);
        const detailsHash = await uploadDisputeDetails({
          reason: disputeReason,
          invoice: address,
          amount: balance.toString(),
        });
        const tx = await lock(provider, address, detailsHash);
        setTransaction(tx);
        await tx.wait();
        setTimeout(() => {
          window.location.href = `/invoice/${address}/locked`;
        }, 2000);
      } catch (lockError) {
        setLocking(false);
        logError({ lockError });
      }
    }
  }, [provider, locking, balance, address, disputeReason]);

  if (locking) {
    return (
      <VStack w="100%" spacing="1rem">
        <Heading
          fontWeight="normal"
          mb="1rem"
          textTransform="uppercase"
          textAlign="center"
        >
          Locking Funds
        </Heading>
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
        <Flex
          w="100%"
          justify="center"
          align="center"
          minH="7rem"
          my="3rem"
          position="relative"
          color="red.500"
        >
          <Loader size="6rem" />
          <Flex
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%,-50%)"
          >
            <LockImage width="2rem" />
          </Flex>
        </Flex>
      </VStack>
    );
  }

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="normal"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
      >
        Lock Funds
      </Heading>

      <Text textAlign="center" fontSize="sm" mb="1rem">
        Locking freezes all remaining funds in the contract and initiates a
        dispute.
      </Text>
      <Text w="100%">
        {'Once a dispute has been initiated, '}
        <AccountLink address={resolver} />
        {
          ' will review your case, the project agreement and dispute reasoning before making a decision on how to fairly distribute remaining funds.'
        }
      </Text>

      <OrderedTextarea
        tooltip="Why do you want to lock these funds?"
        label="Dispute Reason"
        value={disputeReason}
        setValue={setDisputeReason}
      />
      <Text color="red.500" textAlign="center">
        {`Upon resolution, a fee of ${fee} will be deducted from the locked fund amount and sent to `}
        <AccountLink address={resolver} />
        {` for helping resolve this dispute.`}
      </Text>
      <Button
        onClick={lockFunds}
        colorScheme="red"
        isDisabled={!disputeReason}
        textTransform="uppercase"
        size={buttonSize}
        fontFamily="mono"
        fontWeight="normal"
        w="100%"
      >
        {`Lock ${utils.formatUnits(balance, decimals)} ${symbol}`}
      </Button>
      {isKnownResolver(chainId, resolver) && (
        <Link
          href={getResolverInfo(chainId, resolver).termsUrl}
          isExternal
          color="red.500"
          textDecor="underline"
        >
          Learn about {getResolverString(chainId, resolver)} dispute process &
          terms
        </Link>
      )}
    </VStack>
  );
};

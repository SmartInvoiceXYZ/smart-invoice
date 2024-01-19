import React, { useCallback, useMemo, useState } from 'react';
import { Address, Hash, formatUnits } from 'viem';
import { useWalletClient } from 'wagmi';

import {
  Button,
  Flex,
  Heading,
  Image,
  Link,
  Text,
  VStack,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react';
import { waitForTransaction } from '@wagmi/core';

import { AccountLink } from '../shared/AccountLink';
import { OrderedTextarea } from '../shared/OrderedInput';
import {
  getHexChainId,
  getResolverInfo,
  getResolverString,
  getTokenInfo,
  getTxLink,
  isAddress,
  isKnownResolver,
  logError,
} from '../utils/helpers';
import { lock } from '../utils/invoice';
import { uploadDisputeDetails } from '../utils/ipfs';
import { Loader } from './Loader';
import { Invoice } from '../graphql/fetchInvoice';
import { ChainId } from '../constants/config';
import { Network, TokenData } from '../types';

type LockFundsProps = {
  invoice: Invoice,
  balance: bigint,
  tokenData: Record<ChainId, Record<Address, TokenData>>;
}

export function LockFunds({ invoice, balance, tokenData }: LockFundsProps) {
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
  const { network, address, resolver, token, resolutionRate } = invoice || {};
  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [disputeReason, setDisputeReason] = useState('');
  const toast = useToast();

  const fee = useMemo(() => resolutionRate ? `${formatUnits(
    balance / resolutionRate,
    decimals,
  )} ${symbol}` : undefined, [balance, decimals, resolutionRate, symbol]);

  const validAddress = isAddress(address);
  const validResolver = isAddress(resolver);

  const [locking, setLocking] = useState(false);
  const [txHash, setTxHash] = useState<Hash>();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  const lockFunds = useCallback(async () => {
    if (walletClient && !locking && balance > 0 && disputeReason && validAddress) {
      try {
        setLocking(true);
        const detailsHash = await uploadDisputeDetails({
          reason: disputeReason,
          invoice: address,
          amount: balance.toString(),
        });
        const hash = await lock(walletClient, validAddress, detailsHash);
        setTxHash(hash);
        const txReceipt = await waitForTransaction({ chainId, hash });
        setLocking(false);
        if (txReceipt.status === 'success') {
          setTimeout(() => {
            window.location.href = `/invoice/${getHexChainId(
              network as Network,
            )}/${address}`;
          }, 2000);
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
      } catch (lockError) {
        setLocking(false);
        logError({ lockError });
      }
    }
  }, [walletClient, locking, balance, disputeReason, validAddress, address, chainId, network, toast]);

  if (locking) {
    return (
      <VStack w="100%" spacing="1rem">
        <Heading
          fontWeight="bold"
          mb="1rem"
          textTransform="uppercase"
          textAlign="center"
          color="black"
        >
          Locking Funds
        </Heading>
        {chainId && txHash && (
          <Text textAlign="center" fontSize="sm" color="black">
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

        <Flex
          w="100%"
          justify="center"
          align="center"
          minH="7rem"
          my="3rem"
          position="relative"
          color="blue"
        >
          <Loader size="6rem" />

          <Flex
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%,-50%)"
          >
            <Image width="2rem" src="/assets/lock.svg" alt="lock" />
          </Flex>
        </Flex>
      </VStack>
    );
  }

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="bold"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
        color="black"
      >
        Lock Funds
      </Heading>

      <Text textAlign="center" mb="1rem" color="red">
        Locking freezes all remaining funds in the contract and initiates a
        dispute.
      </Text>

      <Text w="100%" color="black">
        {'Once a dispute has been initiated, '}

        { validResolver ? <AccountLink address={validResolver} chainId={chainId} /> : resolver }
        {
          ' will review your case, the project agreement and dispute reasoning before making a decision on how to fairly distribute remaining funds.'
        }
      </Text>

      <OrderedTextarea
        tooltip="Why do you want to lock these funds?"
        label="Dispute Reason"
        value={disputeReason}
        setValue={setDisputeReason}
        infoText="Describe the details of your dispute below. This will be provided to your arbitrator."
      />

      <Text color="red.500" textAlign="center">
        {`Upon resolution, a fee of ${fee} will be deducted from the locked fund amount and sent to `}

        { validResolver ? <AccountLink address={validResolver} chainId={chainId} /> : resolver }
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
        {`Lock ${formatUnits(balance, decimals)} ${symbol}`}
      </Button>
      {validResolver && isKnownResolver(validResolver, chainId) && (
        <Link
          href={getResolverInfo(validResolver, chainId).termsUrl}
          isExternal
          color="red.500"
          textDecor="underline"
        >
          Learn about {getResolverString(validResolver, chainId)} dispute process &
          terms
        </Link>
      )}
    </VStack>
  );
}

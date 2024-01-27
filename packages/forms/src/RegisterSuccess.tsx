import {
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  useClipboard,
} from '@chakra-ui/react';
import { fetchInvoice, Invoice } from '@smart-invoice/graphql';
import { Network } from '@smart-invoice/types';
import { ChakraNextLink, CopyIcon, Loader } from '@smart-invoice/ui';
import {
  awaitInvoiceAddress,
  chainByName,
  getTxLink,
} from '@smart-invoice/utils';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { Address, isAddress } from 'viem';
import { useChainId } from 'wagmi';

const POLL_INTERVAL = 5000;

export function RegisterSuccess() {
  const chainId = useChainId();
  const txHash = '0x';
  const [invoiceId, setInvoiceID] = useState<Address>();
  const [invoice, setInvoice] = useState<Invoice>();

  useEffect(() => {
    if (txHash && chainId) {
      awaitInvoiceAddress(chainId, txHash).then(id => {
        setInvoiceID(id);
      });
    }
  }, [txHash, chainId]);

  useEffect(() => {
    if (!chainId || !invoiceId || !isAddress(invoiceId) || !!invoice)
      return () => undefined;

    let isSubscribed = true;

    const interval = setInterval(() => {
      fetchInvoice(chainId, invoiceId).then(inv => {
        if (isSubscribed && !!inv) {
          setInvoice(inv as unknown as Invoice);
        }
      });
    }, POLL_INTERVAL);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [chainId, invoiceId, invoice]);

  const chainHex = chainByName(
    String(invoice?.network) as Network,
  )?.id?.toString(16);

  const { onCopy: copyId } = useClipboard(_.toLower(invoice?.id));
  const { onCopy: copyLink } = useClipboard(
    `${window.location.origin}/invoice/${chainHex}/${invoice?.id}/${
      String(invoice?.invoiceType) === 'escrow' ? '' : invoice?.invoiceType
    }`,
  );

  return (
    <Stack
      w="100%"
      spacing="1rem"
      align="center"
      justify="center"
      my="8rem"
      maxW="30rem"
      px="1rem"
    >
      <Heading fontWeight="bold" textAlign="center">
        {invoice ? 'Invoice Registered' : 'Invoice Registration Received'}
      </Heading>

      {chainId && txHash && (
        <Text color="black" textAlign="center" fontSize="sm">
          {invoice
            ? 'You can view your transaction '
            : 'You can check the progress of your transaction '}

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

      {invoice ? (
        <>
          <Stack w="100%" align="stretch">
            <Text fontWeight="bold">Your Invoice ID</Text>

            <Flex
              p="0.5rem"
              justify="space-between"
              align="center"
              bg="background"
              borderRadius="0.25rem"
              w="100%"
            >
              <HStack>
                <Link
                  ml="0.5rem"
                  href={`/invoice/${chainHex}/${invoice.id}/${
                    invoice.invoiceType === 'escrow' ? '' : invoice.invoiceType
                  }`}
                  color="charcoal"
                  overflow="hidden"
                >
                  {invoice.id}
                </Link>
                <Button
                  onClick={copyId}
                  variant="ghost"
                  colorScheme="blue"
                  h="auto"
                  w="auto"
                  minW="2"
                  p={2}
                >
                  <CopyIcon boxSize={4} />
                </Button>
              </HStack>
            </Flex>
          </Stack>

          <Stack w="100%" align="stretch" mb="1.5rem">
            <Text fontWeight="bold">Link to Invoice</Text>

            <Flex
              p="0.5rem"
              justify="space-between"
              align="center"
              bg="background"
              borderRadius="0.25rem"
              w="100%"
            >
              <HStack>
                <Link
                  ml="0.5rem"
                  href={`/invoice/${chainHex}/${invoice.id}/${
                    String(invoice.invoiceType) === 'escrow'
                      ? ''
                      : invoice.invoiceType
                  }`}
                  color="charcoal"
                  overflow="hidden"
                >{`${window.location.origin}/invoice/${chainHex}/${invoice.id}/${
                  String(invoice.invoiceType) === 'escrow'
                    ? ''
                    : invoice.invoiceType
                }`}</Link>
                <Button
                  ml={4}
                  onClick={copyLink}
                  variant="ghost"
                  colorScheme="blue"
                  h="auto"
                  w="auto"
                  minW="2"
                  p={2}
                >
                  <CopyIcon boxSize={4} />
                </Button>
              </HStack>
            </Flex>
          </Stack>
        </>
      ) : (
        <Flex py="3rem">
          <Loader size="80" />
        </Flex>
      )}

      <ChakraNextLink href="/invoices">
        <Button
          w="100%"
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          color="white"
          backgroundColor="blue.1"
          textTransform="uppercase"
          fontFamily="mono"
          fontWeight="bold"
          size="lg"
        >
          Return Home
        </Button>
      </ChakraNextLink>
    </Stack>
  );
}

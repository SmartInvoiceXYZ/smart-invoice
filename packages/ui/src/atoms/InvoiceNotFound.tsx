import { Button, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { chainsMap } from '@smart-invoice/utils';
import { useRouter } from 'next/router';
import React from 'react';
import { useChainId } from 'wagmi';

import { WalletFilledIcon } from '../icons/WalletFilledIcon';
import { ChakraNextLink } from '.';
import { Container } from './Container';

export function InvoiceNotFound({
  heading,
  chainId,
}: {
  heading?: string;
  chainId?: number;
}) {
  const currentChainId = useChainId();
  const router = useRouter();

  return (
    <Container>
      <VStack
        spacing="1rem"
        background="background"
        borderRadius="1rem"
        align="center"
        w="calc(100% - 2rem)"
        p="2rem"
        maxW="27.5rem"
        mx={4}
        color="white"
      >
        {chainId && (
          <Flex
            bg="red.500"
            borderRadius="50%"
            p="1rem"
            justify="center"
            align="center"
            color="white"
          >
            <Icon as={WalletFilledIcon} boxSize="1.75rem" />
          </Flex>
        )}

        <Text fontSize="2xl" textAlign="center" fontFamily="heading">
          {heading || 'Invoice Not Found'}
        </Text>
        {chainId && (
          <Text color="greyText">
            Please switch to <b>{chainsMap(chainId)?.name}</b> to view this
            invoice.
          </Text>
        )}

        <ChakraNextLink href="/">
          <Button
            colorScheme="red"
            px={12}
            fontFamily="mono"
            fontWeight="normal"
          >
            Return Home
          </Button>
        </ChakraNextLink>
      </VStack>
    </Container>
  );
}

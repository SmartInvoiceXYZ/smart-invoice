import { useRouter } from 'next/router';
import React from 'react';

import { Button, Flex, Text, VStack } from '@chakra-ui/react';
import { getNetworkName } from '@smart-invoice/utils';

import { WalletFilledIcon } from '../icons/WalletFilledIcon';
import { Container } from './Container';

export function InvoiceNotFound({
  heading,
  chainId,
}: {
  heading?: string;
  chainId?: number;
}) {
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
            <WalletFilledIcon boxSize="1.75rem" />
          </Flex>
        )}

        <Text fontSize="2xl" textAlign="center" fontFamily="heading">
          {heading || 'Invoice Not Found'}
        </Text>
        {chainId && (
          <Text color="greyText">
            Please switch to <b>{getNetworkName(chainId)}</b> to view this
            invoice.
          </Text>
        )}

        <Button
          colorScheme="red"
          px={12}
          onClick={() => router.push('/')}
          fontFamily="mono"
          fontWeight="normal"
        >
          Return Home
        </Button>
      </VStack>
    </Container>
  );
}

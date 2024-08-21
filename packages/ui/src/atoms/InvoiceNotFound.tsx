import { Button, Flex, Icon, Stack, Text } from '@chakra-ui/react';
import { chainsMap } from '@smartinvoicexyz/utils';
import React from 'react';
import { useChainId, useSwitchNetwork } from 'wagmi';

import { WalletFilledIcon } from '../icons/WalletFilledIcon';
import { Container } from './Container';

export function InvoiceNotFound({
  heading,
  chainId,
}: {
  heading?: string;
  chainId?: number;
}) {
  const currentChainId = useChainId();
  const { switchNetwork } = useSwitchNetwork();

  return (
    <Container>
      <Stack
        spacing="1rem"
        background="white"
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

        <Text
          fontSize="2xl"
          textAlign="center"
          fontFamily="heading"
          color="black"
        >
          {heading || 'Invoice Not Found'}
        </Text>
        {chainId && chainId !== currentChainId && (
          <Text color="greyText">
            Please switch to <b>{chainsMap(chainId)?.name}</b> to view this
            invoice.
          </Text>
        )}

        <Button
          colorScheme="red"
          px={12}
          fontFamily="mono"
          fontWeight="normal"
          onClick={() => switchNetwork?.(chainId)}
        >
          Switch Network
        </Button>
      </Stack>
    </Container>
  );
}

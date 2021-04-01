import { Button, Flex, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { WalletFilledIcon } from '../icons/WalletFilledIcon';
import { getNetworkName } from '../utils/helpers';
import { Container } from './Container';

export const InvoiceNotFound = ({ heading, chainId }) => {
  const history = useHistory();
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
          onClick={() => history.push('/')}
          fontFamily="mono"
          fontWeight="normal"
        >
          Return Home
        </Button>
      </VStack>
    </Container>
  );
};

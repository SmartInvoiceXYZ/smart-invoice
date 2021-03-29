import { Button, Heading, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { getNetworkName } from '../utils/helpers';
import { Container } from './Container';

export const InvoiceNotFound = ({ heading, chainId }) => {
  const history = useHistory();
  return (
    <Container overlay>
      <VStack
        w="100%"
        spacing="1rem"
        align="center"
        justify="center"
        my="8rem"
        maxW="35rem"
        px="1rem"
      >
        <Heading fontWeight="normal" textAlign="center">
          {heading || 'Invoice Not Found'}
        </Heading>
        {chainId && (
          <Text>
            Please switch to{' '}
            <b>
              <u>{getNetworkName(chainId)}</u>
            </b>{' '}
            to view this invoice.
          </Text>
        )}

        <Button
          w="100%"
          maxW="30rem"
          variant="outline"
          colorScheme="red"
          textTransform="uppercase"
          fontFamily="mono"
          fontWeight="normal"
          size="lg"
          onClick={() => history.push('/')}
        >
          Return Home
        </Button>
      </VStack>
    </Container>
  );
};

import { Button, Flex, Text, useBreakpointValue } from '@chakra-ui/react';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { Container } from '../shared/Container';

export const Home = () => {
  const history = useHistory();

  const createInvoice = async () => {
    history.push('/create-invoice');
  };

  const viewInvoices = async () => {
    history.push('/invoices');
  };

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  return (
    <Container justify={{ base: 'center', md: 'flex-start' }} direction="row">
      <Flex
        direction="column"
        align="stretch"
        m={{ base: '1rem', md: '2rem' }}
        w={{ base: '22rem', sm: '28rem', lg: '32rem' }}
        maxW="calc(100%-4rem)"
      >
        <Button
          colorScheme="red"
          onClick={createInvoice}
          size={buttonSize}
          fontFamily="mono"
          fontWeight="normal"
        >
          CREATE A NEW SMART INVOICE
        </Button>
        <Text fontWeight="bold" my="0.5rem" w="100%" textAlign="center">
          or
        </Text>
        <Button
          colorScheme="red"
          onClick={viewInvoices}
          size={buttonSize}
          fontFamily="mono"
          fontWeight="normal"
        >
          VIEW EXISTING INVOICE
        </Button>
      </Flex>
    </Container>
  );
};

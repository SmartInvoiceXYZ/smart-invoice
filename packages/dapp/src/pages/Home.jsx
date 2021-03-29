import { Button, Flex, Text, useBreakpointValue } from '@chakra-ui/react';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { useWeb3 } from '../context/Web3Context';
import { Container } from '../shared/Container';
import { logError } from '../utils/helpers';

export const Home = () => {
  const { connectAccount, account } = useWeb3();

  const history = useHistory();

  const createInvoice = async () => {
    if (account) {
      history.push('/create');
    } else {
      try {
        await connectAccount();
        history.push('/create');
      } catch {
        logError("Couldn't connect web3 wallet");
      }
    }
  };

  const viewInvoices = async () => {
    if (account) {
      history.push('/invoices');
    } else {
      try {
        await connectAccount();
        history.push('/invoices');
      } catch {
        logError("Couldn't connect web3 wallet");
      }
    }
  };

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });
  const smallScreen = useBreakpointValue({ base: true, sm: false });

  return (
    <Container justify={{ base: 'center', md: 'flex-start' }} direction="row">
      <Flex
        direction="column"
        align="stretch"
        m={{ base: '1rem', md: '2rem', lg: '4rem' }}
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
          {smallScreen ? 'CREATE NEW INVOICE' : 'CREATE A NEW SMART INVOICE'}
        </Button>
        <Text
          fontWeight="bold"
          my="0.5rem"
          w="100%"
          textAlign="center"
          fontSize={{ base: 'md', md: 'xl' }}
        >
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

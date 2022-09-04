import {
  Button,
  Flex,
  Heading,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useWeb3 } from '../context/Web3Context';
import { logError } from '../utils/helpers';

export const Home = () => {
  const { connectAccount, account } = useWeb3();

  const history = useHistory();
  const [isMobile, onMobile] = useState(false);
  useEffect(() => {
    if (window) {
      toggleMobileMode();
      window.addEventListener('resize', toggleMobileMode);
    }
  });
  const toggleMobileMode = () => {
    if (window.innerWidth < 600) {
      onMobile(true);
    } else {
      onMobile(false);
    }
  };

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

  return (
    <Flex direction="column" align="center" justify="center" gap={6}>
      <Heading
        fontWeight={700}
        fontSize={50}
        textAlign="center"
        color="rgba(50, 60, 71, 1)"
      >
        Welcome to Smart Invoice
      </Heading>
      <Text fontStyle="italic" color="grey">
        How do you want to get started?
      </Text>
      <Flex
        direction={isMobile && 'column'}
        columnGap={10}
        rowGap={4}
        width="100%"
        align="stretch"
        justify="center"
        paddingX={10}
      >
        <Button
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          color="white"
          backgroundColor="blue.1"
          onClick={createInvoice}
          size={buttonSize}
          minW="250px"
          paddingY={6}
        >
          Create Invoice
        </Button>
        <Button
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          color="white"
          backgroundColor="blue.1"
          onClick={viewInvoices}
          size={buttonSize}
          minW="250px"
          paddingY={6}
        >
          View Existing Invoices
        </Button>
      </Flex>
    </Flex>
  );
};

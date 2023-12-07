import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import {
  Button,
  Flex,
  Heading,
  Text,
  useBreakpointValue
} from '@chakra-ui/react';

import { useWeb3 } from '../context/Web3Context';
import { logError } from '../utils/helpers';

function Home() {
  const { account } = useWeb3();

  const router = useRouter();
  const [isMobile, onMobile] = useState(false);
  const toggleMobileMode = () => {
    if (window.innerWidth < 600) {
      onMobile(true);
    } else {
      onMobile(false);
    }
  };
  useEffect(() => {
    if (window) {
      toggleMobileMode();
      window.addEventListener('resize', toggleMobileMode);
    }
  });

  const createInvoice = async () => {
    if (account) {
      router.push('/create');
    } else {
      try {
        router.push('/create');
      } catch (error) {
        logError("Couldn't connect web3 wallet");
      }
    }
  };

  const viewInvoices = async () => {
    if (account) {
      router.push('/invoices');
    } else {
      try {
        router.push('/invoices');
      } catch (error) {
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
        direction={isMobile ? 'column': undefined}
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
}

export default Home;

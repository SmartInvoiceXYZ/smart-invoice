import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useEffect, useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { CreateContext } from '../context/CreateContext';

import { useWeb3 } from '../context/Web3Context';
import { logError } from '../utils/helpers';

export const SelectInvoiceType = () => {
  const { connectAccount, account } = useWeb3();
  const { setInvoiceType } = useContext(CreateContext);

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

  const createType = async invoiceType => {
    try {
      await connectAccount();
      history.push(`/create/${invoiceType}`);
      setInvoiceType(invoiceType);
    } catch {
      logError("Couldn't connect web3 wallet");
    }
  };

  const createEscrow = async () => {
    createType('escrow');
  };

  const createInstant = async () => {
    createType('instant');
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
        Select an Invoice
      </Heading>
      <Text fontStyle="italic" color="grey">
        Which type of invoice do you want to create?
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
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 1)', color: 'white' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 1)', color: 'white' }}
          color="blue.1"
          borderColor="blue.1"
          borderWidth={1}
          backgroundColor="white"
          onClick={createEscrow}
          size={buttonSize}
          width="300px"
          minH="200px"
          flexDir="column"
          paddingY={6}
        >
          <Heading>Escrow</Heading>
          <Box mt={2} textAlign="center" fontSize={12} fontWeight="normal">
            <Text>Secure funds and release payments by milestones.</Text>
            <Text>Includes arbitration.</Text>
            <Text mt={4}>Recommended for medium to large projects</Text>
          </Box>
        </Button>
        <Button
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 1)', color: 'white' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 1)', color: 'white' }}
          color="blue.1"
          borderColor="blue.1"
          borderWidth={1}
          backgroundColor="white"
          onClick={createInstant}
          size={buttonSize}
          width="300px"
          minH="200px"
          paddingY={6}
          flexDir="column"
        >
          <Flex direction="column">
            <Heading>Instant</Heading>
            <Box mt={2} textAlign="center" fontSize={12} fontWeight="normal">
              <Text wordBreak="break-word">Receive payment immediately.</Text>
              <Text>Does NOT include arbitration.</Text>
              <Text mt={4}>Recommended for small projects</Text>
            </Box>
          </Flex>
        </Button>
      </Flex>
    </Flex>
  );
};

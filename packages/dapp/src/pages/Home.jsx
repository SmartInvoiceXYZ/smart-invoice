import {
  Button,
  Flex,
  Heading,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { WhatIsThisModal } from '../components/WhatIsThisModal';
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
  const fontSize = useBreakpointValue({ base: 'lg', sm: 'xl', md: '2xl' });
  const smallScreen = useBreakpointValue({ base: true, sm: false });
  const betaWarningSmallScreen = useBreakpointValue({ base: true, lg: false });
  const { isOpen, onOpen, onClose } = useDisclosure();

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
      <Flex gap={10} width="100%" align="stretch" justify="center">
        <Button
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          color="white"
          backgroundColor="blue.1"
          onClick={createInvoice}
          size={buttonSize}
          minW="250px"
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
        >
          View Existing Invoices
        </Button>
      </Flex>
      {/* <Flex
        direction="row"
        align="stretch"
        m={{ base: '1rem', md: '2rem', lg: '4rem' }}
        mr={{ base: '1rem', md: '2rem', lg: '2rem' }}
        // w={{ base: '22rem', sm: '28rem', lg: '32rem' }}
        // maxW="calc(100% - 2rem)"
      >
        <Button
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          color="white"
          backgroundColor="blue.1"
          onClick={createInvoice}
          // size={buttonSize}
          // width='fit-content'
          fontFamily="mono"
          fontWeight="normal"
        >
          CREATE NEW INVOICE
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
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          color="white"
          backgroundColor="blue.1"
          onClick={viewInvoices}
          size={buttonSize}
          fontFamily="mono"
          fontWeight="normal"
        >
          VIEW EXISTING INVOICES
        </Button>
        <Button
          mt="2rem"
          variant="link"
          color="black"
          textDecor="underline"
          size={buttonSize}
          fontSize={fontSize}
          onClick={onOpen}
          fontFamily="mono"
          fontWeight="normal"
          mx="auto"
          w="auto"
        >
          What is this?
        </Button>
        <WhatIsThisModal isOpen={isOpen} onClose={onClose} />
      </Flex>
      <Flex
        {...(betaWarningSmallScreen
          ? {}
          : {
              width: '100%',
              justify: 'flex-end',
              align: 'flex-end',
              justifySelf: 'flex-end',
              alignSelf: 'flex-end',
            })}
        py="3rem"
        m="1rem"
      ></Flex> */}
    </Flex>
  );
};

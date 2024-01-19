import {
  Button,
  Flex,
  Heading,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChakraNextLink } from '@smart-invoice/ui';
import React from 'react';

function Home() {
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
        direction={{ base: 'column', lg: 'row' }}
        columnGap={10}
        rowGap={4}
        width="100%"
        align="stretch"
        justify="center"
        paddingX={10}
      >
        <ChakraNextLink href="/create">
          <Button size={buttonSize} minW="250px" paddingY={6}>
            Create Invoice
          </Button>
        </ChakraNextLink>

        <ChakraNextLink href="/invoices">
          <Button size={buttonSize} minW="250px" paddingY={6}>
            View Existing Invoices
          </Button>
        </ChakraNextLink>
      </Flex>
    </Flex>
  );
}

export default Home;

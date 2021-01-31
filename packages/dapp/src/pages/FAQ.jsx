import { Heading, Link, Text, useBreakpointValue } from '@chakra-ui/react';
import React from 'react';

import { Container } from '../shared/Container';
import { INVOICE_FACTORY, NETWORK, TOKENS } from '../utils/constants';
import { getAccountString, getAddressLink, getToken } from '../utils/helpers';

export const FAQ = () => {
  const isSmallScreen = useBreakpointValue({ base: true, md: false });
  return (
    <Container overlay color="white">
      <Heading
        fontWeight="normal"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
        color="red.500"
      >
        frequently asked questions
      </Heading>
      <Text textAlign="center">NETWORK CHAIN ID: {NETWORK}</Text>
      <Text textAlign="center">
        INVOICE FACTORY:{' '}
        <Link href={getAddressLink(INVOICE_FACTORY)} isExternal color="red.500">
          {isSmallScreen ? getAccountString(INVOICE_FACTORY) : INVOICE_FACTORY}
        </Link>
      </Text>
      {TOKENS.map(token => (
        <Text textAlign="center">
          {`ERC20 TOKEN ${getToken(token).symbol}: `}
          <Link href={getAddressLink(token)} isExternal color="red.500">
            {isSmallScreen ? getAccountString(token) : token}
          </Link>
        </Text>
      ))}
    </Container>
  );
};

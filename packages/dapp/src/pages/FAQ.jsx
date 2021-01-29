import { Heading, Link, Text, useBreakpointValue } from '@chakra-ui/react';
import React from 'react';

import { Container } from '../shared/Container';
import { ADDRESSES, NETWORK } from '../utils/constants';
import { getAccountString, getAddressLink } from '../utils/helpers';

const { DAI_TOKEN, FACTORY, WRAPPED_TOKEN } = ADDRESSES;
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
        <Link href={getAddressLink(FACTORY)} isExternal color="red.500">
          {isSmallScreen ? getAccountString(FACTORY) : FACTORY}
        </Link>
      </Text>
      <Text textAlign="center">
        WRAPPED NATIVE TOKEN:{' '}
        <Link href={getAddressLink(WRAPPED_TOKEN)} isExternal color="red.500">
          {isSmallScreen ? getAccountString(WRAPPED_TOKEN) : WRAPPED_TOKEN}
        </Link>
      </Text>
      <Text textAlign="center">
        DAI:{' '}
        <Link href={getAddressLink(DAI_TOKEN)} isExternal color="red.500">
          {isSmallScreen ? getAccountString(DAI_TOKEN) : DAI_TOKEN}
        </Link>
      </Text>
    </Container>
  );
};

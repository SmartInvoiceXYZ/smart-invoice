import { Box, Flex, Link as ChakraLink, Image } from '@chakra-ui/react';
import React from 'react';

import logo from '../assets/smart-invoice/white.svg';

export function Footer() {
  return (
    <Box
      background="#334D6E"
      // position="absolute"
      // bottom="0"
      // right="0"
      width="100%"
      alignSelf="end"
      zIndex={5}
    >
      <Flex
        justify="space-between"
        align="center"
        paddingX={20}
        paddingY={4}
        textColor="white"
      >
        <Image src={logo} alt="Smart Invoice" width={160} height={25.34} />
        <Flex gap={8} justify="center" align="center">
          <ChakraLink isExternal href="https://smartinvoice.xyz/">
            Home
          </ChakraLink>
          <ChakraLink
            isExternal
            href="https://docs.smartinvoice.xyz/"
            target="_blank"
          >
            Documentation
          </ChakraLink>
          <ChakraLink href="#">Support</ChakraLink>
          <ChakraLink isExternal href="#" target="_blank">
            Twitter
          </ChakraLink>
        </Flex>
      </Flex>
    </Box>
  );
}

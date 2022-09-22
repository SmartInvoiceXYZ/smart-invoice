import { Box, Flex, Link as ChakraLink, Image } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

import logo from '../assets/smart-invoice/white.svg';

export function Footer() {
  const [isMobile, onMobile] = useState(false);
  useEffect(() => {
    if (window) {
      toggleMobileMode();
      window.addEventListener('resize', toggleMobileMode);
    }
  });
  const toggleMobileMode = () => {
    if (window.innerWidth < 750) {
      onMobile(true);
    } else {
      onMobile(false);
    }
  };

  return (
    <Box background="#334D6E" width="100%" alignSelf="end" zIndex={5}>
      <Flex
        direction={isMobile ? 'column-reverse' : 'row'}
        justify="space-between"
        align="center"
        paddingX={20}
        paddingY={4}
        textColor="white"
        rowGap={4}
      >
        <ChakraLink href="/invoices">
          <Image src={logo} alt="Smart Invoice" width={160} height={25.34} />
        </ChakraLink>
        <Flex gap={8} justify="center" align="center">
          <ChakraLink
            isExternal
            href="https://smartinvoice.xyz"
            target="_blank"
          >
            Website
          </ChakraLink>
          <ChakraLink
            isExternal
            href="https://help.smartinvoice.xyz"
            target="_blank"
          >
            Documentation
          </ChakraLink>
          <ChakraLink
            isExternal
            href="https://help.smartinvoice.xyz/article/7-get-support"
            target="_blank"
          >
            Support
          </ChakraLink>
          <ChakraLink
            isExternal
            href="https://twitter.com/SmartInvoiceXYZ"
            target="_blank"
          >
            Twitter
          </ChakraLink>
        </Flex>
      </Flex>
    </Box>
  );
}

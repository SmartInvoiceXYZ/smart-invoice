import { Button, Flex } from '@chakra-ui/react';
import NextImage from 'next/image';
import NextLink from 'next/link';
import React, { useEffect, useState } from 'react';

import logo from '../../public/logos/smart-invoice/normal.svg';

export function NavBar({ ...props }) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (window) {
      toggleMobile();
      window.addEventListener('resize', toggleMobile);
    }
  });

  function toggleMobile() {
    if (window.innerWidth < 800) {
      setMobile(true);
    } else {
      setMobile(false);
    }
  }

  return (
    <Flex direction="column" background="white" justify="center" align="center">
      <Flex
        direction="row"
        justify="space-between"
        align="center"
        height={75}
        paddingX={mobile ? 2 : 8}
        paddingY={4}
        background="white"
        textColor="gray.dark"
        width="100%"
        {...props}
      >
        {/* Logo */}
        <Flex width={250}>
          <NextLink href="/">
            <Flex cursor="pointer">
              <NextImage
                src={logo}
                alt="Smart Invoice logo"
                width={220}
                height={34.84}
              />
            </Flex>
          </NextLink>
        </Flex>

        {/* Navigation Links */}
        {!mobile && (
          <Flex gap={8} justify="center" align="center">
            <NextLink href="/getting-started/what-is-smart-invoice">
              Documentation
            </NextLink>
            <NextLink href="/about">About</NextLink>
            <NextLink href="/misc/get-support">Help</NextLink>
          </Flex>
        )}

        {/* App Button */}
        <Flex width={250} justify="right">
          <NextLink href="https://app.smartinvoice.xyz" target="_blank">
            <Button
              background="blue.1"
              textColor="white"
              borderRadius={8}
              _hover={{ background: 'blue.hover.1' }}
              target="_blank"
            >
              Open dApp
            </Button>
          </NextLink>
        </Flex>
      </Flex>

      {/* Navigation Links */}
      {mobile && (
        <Flex gap={8} justify="center" align="center" paddingBottom={4}>
          <NextLink href="/getting-started/what-is-smart-invoice">
            Documentation
          </NextLink>
          <NextLink href="/about">About</NextLink>
          <NextLink href="/misc/get-support">Help</NextLink>
        </Flex>
      )}
    </Flex>
  );
}

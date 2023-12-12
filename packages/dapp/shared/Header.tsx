import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';

import { Box, Button, Link as ChakraLink, Flex, Image } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import logo from '../assets/smart-invoice/normal.svg';
import { Web3Context } from '../context/Web3Context';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import styled from '@emotion/styled';
import { theme } from '../theme';

export const StyledButton = styled(Button)`
  &::after {
    box-sizing: inherit;
    transition: all ease-in-out 0.2s;
    background: none repeat scroll 0 0 ${theme.colors.red[500]};
    content: '';
    display: block;
    height: 2px;
    width: 0;
    position: absolute;
    bottom: 0;
    left: 0;
  }
  &:hover {
    text-decoration: none;
    ::after {
      width: 100%;
    }
  }
`;

export function Header() {
  const { address } = useAccount();
  const { connectAccount } = useContext(Web3Context);
  const { data: walletClient } = useWalletClient();
  const [isOpen, onOpen] = useState(false);
  const [isMobile, onMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const toggleMobileMode = () => {
      if (window.innerWidth < 850) {
        onMobile(true);
      } else {
        onMobile(false);
      }
    };
    if (window) {
      toggleMobileMode();
      window.addEventListener('resize', toggleMobileMode);
    }
  });

  useEffect(() => {
    if (address && walletClient) {
      connectAccount(walletClient);
    }
  }, [address, connectAccount, walletClient]);

  return (
    <Flex
      w="100%"
      h={75}
      paddingX={8}
      paddingY={4}
      color="#707683"
      fontFamily="mono"
      top={0}
      left={0}
      justify="space-between"
      align="center"
      background="white"
      zIndex={5}
    >
      <Box width="230px">
        <ChakraLink as={NextLink} href="/invoices">
          <Flex cursor="pointer">
            <Image src={logo.src} alt="Smart Invoice" height={34.84} />
          </Flex>
        </ChakraLink>
      </Box>

      {/* Navigation Links */}
      {!isMobile && (
        <Flex gap={8} justify="center" align="center">
          <ChakraLink href="/invoices">Dashboard</ChakraLink>

          <ChakraLink
            href="https://docs.smartinvoice.xyz"
            target="_blank"
            isExternal
          >
            Documentation
          </ChakraLink>

          <ChakraLink
            href="https://docs.smartinvoice.xyz/misc/get-support"
            target="_blank"
            isExternal
          >
            Support
          </ChakraLink>
        </Flex>
      )}

      <Flex
        align="center"
        height="8rem"
        transition="width 1s ease-out"
        justify="end"
      >
        {!isMobile && (
          <Flex justifyContent="flex-end" width="230px">
            <ConnectButton
              accountStatus="address"
              chainStatus="icon"
              showBalance={false}
            />
          </Flex>
        )}
        {isMobile && (
          <Button
            onClick={() => onOpen((o: any) => !o)}
            variant="link"
            ml={{ base: '0.5rem', sm: '1rem' }}
            zIndex={7}
          >
            <HamburgerIcon
              boxSize={{ base: '2rem', sm: '2.75rem' }}
              transition="all 1s ease-out"
              _hover={{
                transition: 'all 1s ease-out',
                transform: 'rotateZ(90deg)',
              }}
              color="blue.1"
            />
          </Button>
        )}
      </Flex>

      <Flex
        zIndex={6}
        position="fixed"
        left="0"
        top="0"
        bg="white"
        h="100%"
        w="100%"
        direction="column"
        justify="center"
        align="center"
        transition="all 2s ease-out"
        pointerEvents={isOpen ? 'all' : 'none'}
        css={{
          clipPath: isOpen
            ? 'circle(calc(100vw + 100vh) at 90% -10%)'
            : 'circle(100px at 90% -20%)',
        }}
      >
        <Flex height="60px" alignItems="center">
          <ConnectButton
            accountStatus="address"
            chainStatus="icon"
            showBalance={false}
          />
        </Flex>

        <StyledButton
          onClick={() => {
            router.push('/invoices');
            onOpen(false);
          }}
          transition="all 0.5s ease 0.4s"
          my="1rem"
          variant="link"
          color="gray"
          fontWeight="normal"
          fontSize="1.5rem"
        >
          Dashboard
        </StyledButton>

        <ChakraLink href="https://docs.smartinvoice.xyz" isExternal _hover={{}}>
          <StyledButton
            as="span"
            transition="all 0.5s ease 0.4s"
            my="1rem"
            variant="link"
            color="gray"
            fontWeight="normal"
            fontSize="1.5rem"
          >
            Documentation
          </StyledButton>
        </ChakraLink>

        <ChakraLink
          href="https://docs.smartinvoice.xyz/misc/get-support"
          isExternal
          _hover={{}}
        >
          <StyledButton
            as="span"
            transition="all 0.5s ease 0.4s"
            my="1rem"
            variant="link"
            color="gray"
            fontWeight="normal"
            fontSize="1.5rem"
          >
            Support
          </StyledButton>
        </ChakraLink>
      </Flex>
    </Flex>
  );
}

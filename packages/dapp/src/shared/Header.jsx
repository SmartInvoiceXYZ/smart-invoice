import { Box, Button, Flex, Image, Link as ChakraLink } from '@chakra-ui/react';
import styled from '@emotion/styled';
import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient } from 'wagmi';

import { Web3Context } from '../context/Web3Context';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { theme } from '../theme';
import logo from '../assets/smart-invoice/normal.svg';

const StyledButton = styled(Button)`
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

export const NavButton = ({ onClick, children }) => (
  <StyledButton
    onClick={onClick}
    transition="all 0.5s ease 0.4s"
    my="1rem"
    variant="link"
    color="blue.1"
    fontWeight="normal"
    fontSize="1.5rem"
  >
    {children}
  </StyledButton>
);

export const Header = () => {
  const { address } = useAccount();
  const { connectAccount } = useContext(Web3Context);
  const { data: walletClient } = useWalletClient();
  const [isOpen, onOpen] = useState(false);
  const [isMobile, onMobile] = useState(false);
  const history = useHistory();
  useEffect(() => {
    if (window) {
      toggleMobileMode();
      window.addEventListener('resize', toggleMobileMode);
    }
  });
  useEffect(() => {
    if (address && walletClient) {
      connectAccount(walletClient);
    }
  }, [address, walletClient]);
  const toggleMobileMode = () => {
    if (window.innerWidth < 850) {
      onMobile(true);
    } else {
      onMobile(false);
    }
  };

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
      <Box>
        <RouterLink to="/invoices">
          <Flex cursor="pointer">
            <Image src={logo} alt="Smart Invoice" width={220} height={34.84} />
          </Flex>
        </RouterLink>
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
          <Flex justifyContent="flex-end" width={'294px'}>
            <ConnectButton />
          </Flex>
        )}
        {isMobile && (
          <Button
            onClick={() => onOpen(o => !o)}
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
        <Flex height={'60px'} alignItems="center">
          <ConnectButton />
        </Flex>
        <StyledButton
          onClick={() => {
            history.push('/invoices');
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
};

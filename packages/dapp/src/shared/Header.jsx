import {
  Box,
  Button,
  Flex,
  Image,
  Link as ChakraLink,
  useBreakpointValue,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient } from 'wagmi';

import { Web3Context } from '../context/Web3Context';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { theme } from '../theme';
import { getProfile } from '../utils/3box';
import { ProfileButton } from './ProfileButton';
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
  const { account, disconnect, connectAccount, chainId } =
    useContext(Web3Context);
  const { data: walletClient } = useWalletClient();
  const [isOpen, onOpen] = useState(false);
  const [isMobile, onMobile] = useState(false);
  const history = useHistory();
  const [profile, setProfile] = useState();
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
  useEffect(() => {
    if (account) {
      getProfile(account).then(p => setProfile(p));
    }
  }, [account]);
  const toggleMobileMode = () => {
    if (window.innerWidth < 850) {
      onMobile(true);
    } else {
      onMobile(false);
    }
  };
  const buttonVariant = useBreakpointValue({
    base: isOpen ? 'ghost' : 'link',
    md: 'ghost',
  });
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
      <Box width={250}>
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
        {/* {account ? (
          <Flex justify="center" align="center" zIndex={5}>
            <Popover>
              <PopoverTrigger>
                <Button
                  h="auto"
                  fontWeight="normal"
                  borderRadius="full"
                  variant={buttonVariant}
                  colorScheme="red"
                  fontFamily="mono"
                  p={{ base: 0, md: 2 }}
                >
                  <Flex
                    borderRadius="50%"
                    w="2.5rem"
                    h="2.5rem"
                    overflow="hidden"
                    justify="center"
                    align="center"
                    bgColor="black"
                    bgImage={profile && `url(${profile.imageUrl})`}
                    border={`1px solid ${theme.colors.white20}`}
                    bgSize="cover"
                    bgRepeat="no-repeat"
                    bgPosition="center center"
                  />
                  <Flex direction="column" gap={1} align="left">
                    <Text
                      px={2}
                      display={{ base: 'none', md: 'flex' }}
                      fontFamily="'Roboto Mono', monospace;"
                      color="#192A3E"
                      fontWeight={500}
                      fontSize={14}
                    >
                      {profile && profile.name ? profile.name : 'Anonymous'}
                    </Text>
                    <Text
                      px={2}
                      display={{ base: 'none', md: 'flex' }}
                      fontFamily="'Roboto Mono', monospace;"
                      color="grey"
                      fontSize={12}
                    >
                      {getAccountString(account)}
                    </Text>
                  </Flex>
                  <Tag
                    background="#90A0B7"
                    display={{ base: 'none', md: 'flex' }}
                    size="sm"
                    color="white"
                  >
                    {getNetworkLabel(chainId)}
                  </Tag>
                </Button>
              </PopoverTrigger>
              <PopoverContent bg="none" w="auto" mx="4rem">
                <Button
                  onClick={() => {
                    disconnect();
                  }}
                  backgroundColor="blue.1"
                  _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                  _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
                  color="white"
                  fontWeight="normal"
                  fontFamily="mono"
                  textTransform="uppercase"
                >
                  Disconnect
                </Button>
              </PopoverContent>
            </Popover>
          </Flex>
        ) : (
          <ConnectButton />
        )} */}
        <ConnectButton />
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
        {account && profile && chainId && (
          <ProfileButton
            account={account}
            chainId={chainId}
            profile={profile}
            disconnect={disconnect}
          />
        )}
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

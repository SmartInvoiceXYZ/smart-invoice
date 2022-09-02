import {
  Box,
  Button,
  Flex,
  Image,
  Link as ChakraLink,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tag,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink, useHistory } from 'react-router-dom';

import LogoText from '../assets/logo.svg';
import Logo from '../assets/raidguild__logo.png';
import { Web3Context } from '../context/Web3Context';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { theme } from '../theme';
import { getProfile } from '../utils/3box';
import { getAccountString, getNetworkLabel } from '../utils/helpers';
import { Footer } from './Footer';
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
    color="red.500"
    fontWeight="normal"
    fontSize="1.5rem"
  >
    {children}
  </StyledButton>
);

export const Header = () => {
  const { account, disconnect, chainId } = useContext(Web3Context);
  const [isOpen, onOpen] = useState(false);
  const history = useHistory();
  const [profile, setProfile] = useState();
  useEffect(() => {
    if (account) {
      getProfile(account).then(p => setProfile(p));
    }
  }, [account]);
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
      // position="absolute"
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
          href="https://docs.smartinvoice.xyz/docs/FAQ"
          target="_blank"
          isExternal
        >
          Support
        </ChakraLink>
      </Flex>

      <Flex
        // mx={{ base: '2rem', sm: '3rem' }}
        align="center"
        height="8rem"
        transition="width 1s ease-out"
        width={250}
      >
        {account && (
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
                  colorScheme="blue"
                  fontWeight="normal"
                  fontFamily="mono"
                  textTransform="uppercase"
                >
                  Disconnect
                </Button>
              </PopoverContent>
            </Popover>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

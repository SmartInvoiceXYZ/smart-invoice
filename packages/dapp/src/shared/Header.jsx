import {
  Box,
  Button,
  Flex,
  Image,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import React, { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import LogoText from '../assets/logo.svg';
import Logo from '../assets/raidguild__logo.png';
import { Web3Context } from '../context/Web3Context';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { theme } from '../theme';
import { getProfile } from '../utils/3box';
import { isBackdropFilterSupported } from '../utils/compatibilityHelpers';
import { NAV_ITEMS } from '../utils/constants';
import { getAccountString } from '../utils/helpers';

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
  const { account, disconnect } = useContext(Web3Context);
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
  const overlayStyles = isBackdropFilterSupported()
    ? {
        backgroundColor: 'black30',
        backdropFilter: 'blur(8px)',
      }
    : {
        backgroundColor: 'black80',
      };
  return (
    <Flex
      w="100%"
      h="8rem"
      color="white"
      fontFamily="mono"
      position="absolute"
      top={0}
      left={0}
      justify="space-between"
      align="center"
    >
      <Box zIndex={5}>
        <Link to="/">
          <Flex align="center" p="1rem" m="1rem">
            <Image
              src={Logo}
              alt="Raid Guild"
              w={{ base: '3rem', sm: '4rem', md: '5rem' }}
            />
            <Image
              src={LogoText}
              alt="Smart Invoice"
              h={{ base: '2rem', sm: '3rem', md: 'auto' }}
            />
          </Flex>
        </Link>
      </Box>
      <Flex
        mx={{ base: '2rem', sm: '3rem' }}
        align="center"
        zIndex={7}
        height="8rem"
        transition="width 1s ease-out"
        position={isOpen ? 'fixed' : undefined}
        top={isOpen ? '0' : undefined}
        right={isOpen ? '0' : undefined}
        w={
          isOpen
            ? { base: 'calc(100% - 4rem)', sm: 'calc(100% - 6rem)' }
            : undefined
        }
        justify={isOpen ? 'space-between' : undefined}
      >
        {account && (
          <Flex justify="center" align="center">
            <Popover>
              <PopoverTrigger>
                <Button
                  h="auto"
                  fontWeight="normal"
                  borderRadius={{ base: 'full', md: undefined }}
                  variant={buttonVariant}
                  colorScheme="red"
                  fontFamily="mono"
                  p={{ base: isOpen ? 2 : 0, md: 2 }}
                  css={overlayStyles}
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
                  <Text
                    px={2}
                    display={{ base: isOpen ? 'flex' : 'none', md: 'flex' }}
                    fontFamily="'Roboto Mono', monospace;"
                    color="red.500"
                  >
                    {profile && profile.name
                      ? profile.name
                      : getAccountString(account)}
                  </Text>
                </Button>
              </PopoverTrigger>
              <PopoverContent bg="none" w="auto" mx={isOpen ? 0 : '4rem'}>
                <Button
                  onClick={() => {
                    disconnect();
                  }}
                  colorScheme="red"
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
        <Button
          onClick={() => onOpen(o => !o)}
          variant="link"
          ml={{ base: '0.5rem', sm: '1rem' }}
        >
          <HamburgerIcon
            boxSize={{ base: '2rem', sm: '2.75rem' }}
            transition="all 1s ease-out"
            _hover={{
              transition: 'all 1s ease-out',
              transform: 'rotateZ(90deg)',
            }}
            color="red.500"
          />
        </Button>
      </Flex>
      <Flex
        zIndex={6}
        position="fixed"
        left="0"
        top="0"
        bg="black"
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
        {NAV_ITEMS.map(item => {
          return (
            <NavButton
              key={item.name}
              onClick={() => {
                history.push(item.link);
                onOpen(false);
              }}
            >
              {item.name}
            </NavButton>
          );
        })}
      </Flex>
    </Flex>
  );
};

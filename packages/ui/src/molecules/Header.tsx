import { Button, Flex, Image, useDisclosure } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import _ from 'lodash';
import { useAccount } from 'wagmi';

import { ChakraNextLink } from '../atoms';
import { HamburgerIcon } from '../icons/HamburgerIcon';
import { theme } from '../theme';

export const StyledButton = styled(Button)`
  &::after {
    box-sizing: inherit;
    transition: all ease-in-out 0.2s;
    background: none repeat scroll 0 0 ${theme.colors.blue[1]};
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

type Link = {
  label: string;
  href: string;
  isInternal?: boolean;
};

const LINKS: Link[] = [
  { label: 'Dashboard', href: '/invoices', isInternal: true },
  {
    label: 'Documentation',
    href: 'https://smartinvoice.xyz/getting-started/what-is-smart-invoice',
  },
  { label: 'About', href: 'https://smartinvoice.xyz/about' },
  { label: 'Help', href: 'https://smartinvoice.xyz/misc/get-support' },
];

export function Header() {
  const { isOpen, onToggle } = useDisclosure();
  const { isConnected } = useAccount();

  const links = isConnected ? LINKS : LINKS.slice(1);

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
      position="relative"
    >
      <ChakraNextLink href={isConnected ? '/invoices' : '/'}>
        <Flex cursor="pointer">
          <Image
            src="/assets/smart-invoice/normal.svg"
            alt="Smart Invoice"
            height={34.84}
          />
        </Flex>
      </ChakraNextLink>

      <Flex
        gap={8}
        justify="center"
        align="center"
        display={{ base: 'none', lg: 'flex' }}
        position="absolute"
        left="50%"
        transform="translateX(-50%)"
      >
        {_.map(links, ({ label, href }) => (
          <ChakraNextLink
            key={href}
            href={href}
            isExternal={!href?.startsWith('/')}
          >
            {label}
          </ChakraNextLink>
        ))}
      </Flex>

      <Flex
        align="center"
        height="8rem"
        transition="width 1s ease-out"
        justify="end"
      >
        <Flex justifyContent="flex-end" display={{ base: 'none', lg: 'flex' }}>
          <ConnectButton
            accountStatus="full"
            chainStatus="full"
            showBalance={false}
          />
        </Flex>
        <Button
          onClick={onToggle}
          variant="link"
          ml={{ base: '0.5rem', sm: '1rem' }}
          zIndex={7}
          display={{ base: 'flex', lg: 'none' }}
        >
          <HamburgerIcon
            boxSize={{ base: '2rem', sm: '2.75rem' }}
            transition="all 0.5s ease-out"
            _hover={{
              transition: 'all 0.5s ease-out',
              transform: 'rotateZ(90deg)',
            }}
            color="blue.1"
          />
        </Button>
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
        gap={6}
        transition="all 2s ease-out"
        pointerEvents={isOpen ? 'all' : 'none'}
        css={{
          clipPath: isOpen
            ? 'circle(calc(100vw + 100vh) at 90% -10%)'
            : 'circle(100px at 90% -20%)',
        }}
      >
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />

        {_.map(links, ({ label, href, isInternal }) => (
          <ChakraNextLink
            href={href}
            key={href}
            isExternal={!href?.startsWith('/')}
            onClick={isInternal ? onToggle : undefined}
          >
            <StyledButton
              transition="all 0.5s ease 0.4s"
              variant="link"
              color="gray"
              fontWeight="normal"
              fontSize="lg"
            >
              {label}
            </StyledButton>
          </ChakraNextLink>
        ))}
      </Flex>
    </Flex>
  );
}

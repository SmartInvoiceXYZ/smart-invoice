import { Link as ChakraLink, LinkProps } from '@chakra-ui/react';
import NextLink from 'next/link';

export function ChakraNextLink({ href, children, ...props }: LinkProps) {
  return (
    <ChakraLink as={NextLink} href={href} {...props} passHref>
      {children}
    </ChakraLink>
  );
}

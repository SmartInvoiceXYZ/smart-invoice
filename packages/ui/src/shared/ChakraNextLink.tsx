import { LinkProps, Link as ChakraLink } from '@chakra-ui/react';
import NextLink from 'next/link';

const ChakraNextLink = ({ href, children, ...props }: LinkProps) => (
  <ChakraLink as={NextLink} href={href} {...props} passHref>
    {children}
  </ChakraLink>
);

export default ChakraNextLink;

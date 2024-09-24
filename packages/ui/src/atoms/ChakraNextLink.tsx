import {
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
} from '@chakra-ui/next-js';

export function ChakraNextLink({
  href = '',
  ...props
}: Omit<ChakraLinkProps, 'href'> & { href?: string | undefined }) {
  return <ChakraLink href={href} {...props} />;
}

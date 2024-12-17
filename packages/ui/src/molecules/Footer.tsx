import { Box, Flex, Image, Link as ChakraLink } from '@chakra-ui/react';
import _ from 'lodash';

const links = [
  { label: 'Website', href: 'https://smartinvoice.xyz' },
  { label: 'Documentation', href: 'https://docs.smartinvoice.xyz' },
  { label: 'Twitter', href: 'https://twitter.com/SmartInvoiceXYZ' },
  { label: 'Discord', href: 'https://discord.gg/Rws3gEu8W7' },
];

export function Footer() {
  return (
    <Box background="#334D6E" width="100%" alignSelf="end" zIndex={5}>
      <Flex
        direction={{ base: 'column-reverse', md: 'row' }}
        justify="space-between"
        align="center"
        paddingX={20}
        paddingY={4}
        textColor="white"
        rowGap={4}
      >
        <ChakraLink href="/invoices">
          <Image
            src="/assets/smart-invoice/white.svg"
            alt="Smart Invoice"
            width={160}
            height={25.34}
          />
        </ChakraLink>

        <Flex gap={8} justify="center" align="center">
          {_.map(links, ({ label, href }) => (
            <ChakraLink
              key={href}
              isExternal
              href={href}
              target="_blank"
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {label}
            </ChakraLink>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}

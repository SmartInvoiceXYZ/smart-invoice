import { Box, Button, Flex, Heading, Spinner, Stack } from '@chakra-ui/react';
import { useInvoiceList } from '@smart-invoice/hooks';
import {
  ChakraNextLink,
  InvoiceDashboardTable,
  useMediaStyles,
} from '@smart-invoice/ui';
import { chainsMap } from '@smart-invoice/utils';
import _ from 'lodash';
import React from 'react';
import { useAccount, useChainId } from 'wagmi';

function Invoices() {
  const { address } = useAccount();
  const chainId = useChainId();

  const { primaryButtonSize } = useMediaStyles();

  const { data: invoices, isLoading } = useInvoiceList({ chainId });
  console.log(invoices);

  if (!_.isEmpty(invoices) && !isLoading) {
    return (
      <Box paddingY={16}>
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={4}
          width="100%"
        >
          {chainId ? (
            <Heading color="gray" size="lg">
              No invoices found on {chainsMap(chainId)?.name}.
            </Heading>
          ) : (
            <Heading color="gray" size="lg">
              Wallet not connected.
            </Heading>
          )}

          <ChakraNextLink href="/create">
            <Button size={primaryButtonSize} minW="250px" paddingY={6}>
              Create Invoice
            </Button>
          </ChakraNextLink>
        </Flex>
      </Box>
    );
  }

  if (!_.isEmpty(invoices)) {
    return (
      <Box paddingY={16}>
        <Stack align="center">
          <Heading color="gray" as="h1">
            Invoices Loading
          </Heading>
          <Spinner />
        </Stack>
      </Box>
    );
  }

  return (
    <Box paddingY={16} flex="1 0 100%">
      <InvoiceDashboardTable chainId={chainId} searchInput={address} />
    </Box>
  );
}

export default Invoices;

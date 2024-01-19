/* eslint-disable no-nested-ternary */
import {
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useInvoiceList } from '@smart-invoice/hooks';
import { ChakraNextLink, InvoiceDashboardTable } from '@smart-invoice/ui';
import { chainsMap } from '@smart-invoice/utils';
import _ from 'lodash';
import React from 'react';
import { useAccount, useChainId } from 'wagmi';

function Invoices() {
  const { address } = useAccount();
  const chainId = useChainId();

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  const { data: invoices, isLoading } = useInvoiceList({ chainId });

  return (
    <Box paddingY={16} flex={!_.isEmpty(invoices) ? '1 0 100%' : undefined}>
      {isLoading ? (
        <Stack align="center">
          <Heading color="gray" as="h1">
            Invoices Loading
          </Heading>
          <Spinner />
        </Stack>
      ) : !_.isEmpty(invoices) ? (
        <InvoiceDashboardTable chainId={chainId} searchInput={address} />
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={4}
          width="100%"
        >
          {chainId ? (
            <Heading color="gray" size="lg">
              No invoices found on {chainsMap(chainId).name}.
            </Heading>
          ) : (
            <Heading color="gray" size="lg">
              Wallet not connected.
            </Heading>
          )}

          <ChakraNextLink href="/create">
            <Button size={buttonSize} minW="250px" paddingY={6}>
              Create Invoice
            </Button>
          </ChakraNextLink>
        </Flex>
      )}
    </Box>
  );
}

export default Invoices;

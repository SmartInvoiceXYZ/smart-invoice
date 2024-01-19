/* eslint-disable no-nested-ternary */
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useWalletClient } from 'wagmi';

import {
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react';

import { InvoiceDashboardTable } from '@smart-invoice/ui';

const Invoices = () => {
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [resultCount, setResultCount] = useState<number>();
  const account = walletClient?.account?.address;
  const chain = walletClient?.chain;
  const router = useRouter();
  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  return (
    <Box
      paddingY={16}
      flex={resultCount && resultCount > 0 ? '1 0 100%' : undefined}
    >
      {loading ? (
        <Stack align="center">
          <Heading color="gray" as="h1">
            Invoices Loading
          </Heading>
          <Spinner />
        </Stack>
      ) : resultCount && resultCount > 0 ? (
        <InvoiceDashboardTable
          chainId={chain?.id}
          searchInput={account}
          onLoading={(l, c) => {
            setLoading(l);
            setResultCount(c);
          }}
        />
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={4}
          width="100%"
        >
          {chain ? (
            <Heading color="gray" size="lg">
              No invoices found on {chain.name}.
            </Heading>
          ) : (
            <Heading color="gray" size="lg">
              Wallet not connected.
            </Heading>
          )}

          <Button
            color="white"
            backgroundColor="blue.1"
            size={buttonSize}
            minW="250px"
            paddingY={6}
            _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            onClick={() => router.push('/create')}
          >
            Create Invoice
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default Invoices;

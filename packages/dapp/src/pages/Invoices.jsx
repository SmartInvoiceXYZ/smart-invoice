import {
  Stack,
  Spinner,
  Heading,
  Box,
  Button,
  useBreakpointValue,
} from '@chakra-ui/react';

import React, { useContext, useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { SearchContext, SearchContextProvider } from '../context/SearchContext';
import { Web3Context } from '../context/Web3Context';
import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';
import { InvoiceDashboardTable } from '../components/InvoiceDashboardTable';
import { networkNames } from '../utils/constants';

const InvoicesInner = ({ history }) => {
  const { search, setSearch, result, fetching, loading } =
    useContext(SearchContext);
  const [{ tokenData }] = useFetchTokensViaIPFS();
  const { account, chainId } = useContext(Web3Context);

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  useEffect(() => {
    if (account) {
      setSearch(account);
    }
  }, [account, setSearch]);

  return (
    <Box paddingY={16} flex={loading ? null : '1 0 100%'}>
      {loading ? (
        <Stack align="center">
          <Heading color="gray" as="h1">
            Invoices Loading
          </Heading>
          <Spinner />
        </Stack>
      ) : result && result.length > 0 && tokenData !== undefined ? (
        <InvoiceDashboardTable
          result={result}
          tokenData={tokenData}
          chainId={chainId}
          history={history}
        />
      ) : (
        <Stack align="center">
          <Heading color="gray" size="lg" align="center" mb={4}>
            No invoices found on {networkNames[chainId]}.
          </Heading>
          <Button
            color="white"
            backgroundColor="blue.1"
            size={buttonSize}
            minW="250px"
            paddingY={6}
            _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
            onClick={() => history.push('/create')}
          >
            Create Invoice
          </Button>
        </Stack>
      )}
    </Box>
  );
};

const InvoicesWithProvider = props => (
  <SearchContextProvider>
    <InvoicesInner {...props} />
  </SearchContextProvider>
);

export const Invoices = withRouter(InvoicesWithProvider);

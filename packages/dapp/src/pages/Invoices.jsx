import { Stack, Spinner, Heading, Box } from '@chakra-ui/react';

import React, { useContext, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { SearchContext, SearchContextProvider } from '../context/SearchContext';
import { Web3Context } from '../context/Web3Context';
import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';
import { InvoiceDashboardTable } from '../components/InvoiceDashboardTable';
import { Styles } from './InvoicesStyles';

const InvoicesInner = ({ history }) => {
  const { search, setSearch, result, fetching, loading } = useContext(
    SearchContext,
  );
  const [{ tokenData }] = useFetchTokensViaIPFS();
  const { account, chainId } = useContext(Web3Context);

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
          <Heading color="gray" as="h1">
            No Invoices Found
          </Heading>
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

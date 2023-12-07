import { useRouter } from 'next/router';
import React, { useContext, useEffect } from 'react';

/* eslint-disable no-nested-ternary */
import {
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  useBreakpointValue
} from '@chakra-ui/react';

import { InvoiceDashboardTable } from '../components/InvoiceDashboardTable';
import {  networkNames } from '../constants';
import { SearchContext, SearchContextProvider } from '../context/SearchContext';
import { Web3Context } from '../context/Web3Context';
import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';

function InvoicesInner() {
  const { setSearch, result, loading } = useContext(SearchContext);
  const [{ tokenData }] = useFetchTokensViaIPFS();
  const { account, chainId } = useContext(Web3Context);
  const router = useRouter();

  const buttonSize = useBreakpointValue({ base: 'sm', sm: 'md', md: 'lg' });

  useEffect(() => {
    if (account) {
      setSearch(account);
    }
  }, [account, setSearch]);

  return (
    
    <Box
      paddingY={16}
      flex={
        result && result.length > 0 && tokenData !== undefined
          ? '1 0 100%'
          : undefined
      }
    >
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
        />
      ) : (
        
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={4}
          width="100%"
        >
          
          { chainId && (<Heading color="gray" size="lg">
            No invoices found on {networkNames[chainId]}.
          </Heading>)}
          
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
}

function InvoicesWithProvider(props: any) {
  return (
    
    <SearchContextProvider>
      
      <InvoicesInner {...props} />
    </SearchContextProvider>
  );
}

export default InvoicesWithProvider;

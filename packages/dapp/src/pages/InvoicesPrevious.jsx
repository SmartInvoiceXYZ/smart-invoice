import {
  Button,
  Flex,
  Heading,
  Text,
  useBreakpointValue,
  IconButton,
  Td,
  Tr,
  Th,
  Table,
  Tbody,
  Thead,
  chakra,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useMemo } from 'react';
import { withRouter } from 'react-router-dom';
import { useTable, useSortBy } from 'react-table';
import { Loader } from '../components/Loader';
import { SearchContext, SearchContextProvider } from '../context/SearchContext';
import { Web3Context } from '../context/Web3Context';
import { useInvoiceStatus } from '../hooks/useInvoiceStatus';
import { Container } from '../shared/Container';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { theme } from '../theme';
import { dateTimeToDate, getTokenInfo } from '../utils/helpers';
import { unixToDateTime } from '../utils/invoice';
import { formatUnits } from 'ethers/lib/utils';
import { useFetchTokensViaIPFS } from '../hooks/useFetchTokensViaIPFS';
import { VerticalDotsIcon } from '../icons/VerticalDots';
import { InvoiceDashboardTable } from '../components/InvoiceDashboardTableBackup';
import { NewTable } from '../components/NewInvoiceDashboardTable';

const InvoicesInner = ({ history }) => {
  const { search, setSearch, result, fetching } = useContext(SearchContext);
  const [{ tokenData }] = useFetchTokensViaIPFS();
  const { account, chainId } = useContext(Web3Context);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        columns: [
          {
            Header: 'First Name',
            accessor: 'firstName',
          },
          {
            Header: 'Last Name',
            accessor: 'lastName',
          },
        ],
      },
      {
        Header: 'Info',
        columns: [
          {
            Header: 'Age',
            accessor: 'age',
            collapse: true,
          },
          {
            Header: 'Visits',
            accessor: 'visits',
            collapse: true,
          },
          {
            Header: 'Status',
            accessor: 'status',
          },
          {
            Header: 'Profile Progress',
            accessor: 'progress',
            collapse: true,
          },
        ],
      },
    ],
    [],
  );

  useEffect(() => {
    if (account) {
      setSearch(account);
    }
  }, [account, setSearch]);
  // const fontSize = useBreakpointValue({ base: 'md', sm: 'lg', md: 'xl' });
  const testColor = useBreakpointValue({
    base: 'red',
    sm: 'pink',
    md: 'green',
    lg: 'yellow',
  });
  const templateColumnWidth = useBreakpointValue({
    base: 'repeat(5, minmax(0, 1fr))',
    sm: 'repeat(5, 1fr)',
    md: 'repeat(5, 1fr)',
    lg: 'repeat(5, minmax(0, 1fr))',
  });
  return (
    <Container justify="center" direction="row">
      {result && result.length !== 0 ? (
        <NewTable
          columns={columns}
          result={result}
          tokenData={tokenData}
          chainId={chainId}
        />
      ) : (
        'Invoices Loading'
      )}
      <Flex
        direction="column"
        align="stretch"
        mx={{ base: '1rem', md: '2rem' }}
        w={{ base: '55rem', md: '55rem' }}
        maxW="calc(100%-4rem)"
        fontSize={{ base: 'md', sm: 'lg', lg: 'xl' }}
        mb="4rem"
      >
        <Heading fontWeight="bold" mb="1rem">
          My Invoices
        </Heading>
        {/* <InputGroup size="lg">
          <Input
            type="text"
            fontSize={fontSize}
            value={search}
            placeholder="Search for Invoice"
            onChange={e => setSearch(e.target.value)}
            borderColor="red.500"
          />
          <InputRightElement>
            {fetching ? (
              <Loader size="20" />
            ) : (
              <SearchIcon boxSize={{ base: '1.25rem', md: '1.5rem' }} />
            )}
          </InputRightElement>
        </InputGroup> */}

        <Flex
          direction="column"
          align="stretch"
          w="100%"
          mt="0.5rem"
          maxH="30rem"
          overflowY="auto"
        >
          {result && result.length !== 0 ? (
            <InvoiceDashboardTable
              chainId={chainId}
              result={result}
              tokenData={tokenData}
            />
          ) : (
            'Invoices Loading'
          )}

          {!fetching && result && result.length === 0 && (
            <Flex
              justify="space-between"
              align="center"
              p="0.5rem"
              borderBottom="solid 1px #505050"
            >
              <Text color="white"> No invoices found </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Container>
  );
};

const InvoicesWithProvider = props => (
  <SearchContextProvider>
    <InvoicesInner {...props} />
  </SearchContextProvider>
);

export const Invoices = withRouter(InvoicesWithProvider);

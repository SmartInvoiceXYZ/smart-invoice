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

const InvoiceStatusLabel = ({ invoice }) => {
  const { funded, label, loading } = useInvoiceStatus(invoice);
  const { isLocked, terminationTime } = invoice;
  const terminated = terminationTime > Date.now();
  const disputeResolved = label === 'Dispute Resolved';

  return (
    <Flex
      // backgroundColor={funded ? 'green' : 'orange'}
      backgroundColor={
        terminated
          ? 'gray'
          : isLocked
          ? 'red'
          : funded
          ? 'green'
          : disputeResolved
          ? 'gray'
          : 'orange'
      }
      padding="6px"
      borderRadius="10"
      minWidth="165px"
      justify="center"
    >
      <Text
        color="white"
        fontWeight="bold"
        textTransform="uppercase"
        textAlign="center"
        fontSize="15px"
      >
        {loading ? <Loader size="20" /> : label}
      </Text>
    </Flex>
  );
};

function InvoiceDashboardTable({ result, tokenData, chainId }) {
  const data = useMemo(() => {
    const dataArray = [];

    result.forEach((invoice, index) => {
      const { decimals, symbol } = getTokenInfo(
        chainId,
        invoice.token,
        tokenData,
      );
      const details = {
        createdAt: dateTimeToDate(unixToDateTime(invoice.createdAt)),
        projectName: invoice.projectName,
        amount: formatUnits(invoice.total, decimals),
        currency: symbol,
        status: <InvoiceStatusLabel invoice={invoice} />,
        action: (
          <IconButton
            backgroundColor="white"
            size="lg"
            _hover={{
              bgColor: 'white',
              border: '1px',
              borderColor: 'gray.200',
            }}
            _active={{
              bgColor: 'white20',
            }}
            icon={<VerticalDotsIcon />}
          />
        ),
      };
      dataArray.push(details);
    });
    return dataArray;
  }, [chainId, result, tokenData]);

  const columns = useMemo(
    () => [
      {
        Header: 'Date Created',
        accessor: 'createdAt',
      },
      {
        Header: 'Invoice Name/ID',
        accessor: 'projectName',
      },
      {
        Header: 'Amount',
        accessor: 'amount',
        isNumeric: true,
      },
      {
        Header: 'Currency',
        accessor: 'currency',
        isNumeric: true,
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Action',
        accessor: 'action',
      },
    ],
    [],
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useSortBy);

  //   <Button
  //   borderTopLeftRadius="10"
  //   borderBottomLeftRadius="10"
  //   borderTopRightRadius="0"
  //   borderBottomRightRadius="0"
  //   variant="ghost"
  //   size="lg"
  //   backgroundColor="white"
  //   boxShadow="sm"
  //   onClick={() =>
  //     history.push(
  //       `/invoice/${getHexChainId(invoice.network)}/${
  //         invoice.address
  //       }`,
  //     )
  //   }
  //   _hover={{
  //     bgColor: 'white',
  //     border: '1px',
  //     borderColor: 'gray.200',
  //   }}
  //   _active={{
  //     bgColor: 'white20',
  //   }}
  //   px={{ base: '0.5rem', md: '1rem' }}
  // >

  return (
    <Table {...getTableProps()} backgroundColor="white" borderRadius="10">
      <Thead>
        {headerGroups.map(headerGroup => (
          <Tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <Th
                {...column.getHeaderProps(column.getSortByToggleProps())}
                isNumeric={column.isNumeric}
              >
                {column.render('Header')}
                <chakra.span pl="4">
                  {column.isSorted ? (
                    column.isSortedDesc ? (
                      <TriangleDownIcon aria-label="sorted descending" />
                    ) : (
                      <TriangleUpIcon aria-label="sorted ascending" />
                    )
                  ) : null}
                </chakra.span>
              </Th>
            ))}
          </Tr>
        ))}
      </Thead>
      <Tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <Tr {...row.getRowProps()}>
              {row.cells.map(cell => (
                <Td {...cell.getCellProps()} isNumeric={cell.column.isNumeric}>
                  {cell.render('Cell')}
                </Td>
              ))}
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}

const InvoicesInner = ({ history }) => {
  const { search, setSearch, result, fetching } = useContext(SearchContext);
  const [{ tokenData }] = useFetchTokensViaIPFS();
  const { account, chainId } = useContext(Web3Context);

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

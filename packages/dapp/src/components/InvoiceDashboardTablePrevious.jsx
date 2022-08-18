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
import { Loader } from './Loader';
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

// responsive table example: https://codesandbox.io/s/j51cd?file=/src/TestTable.tsx
// https://react-table-v7.tanstack.com/docs/examples/full-width-resizable-table

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

export function InvoiceDashboardTable({ result, tokenData, chainId }) {
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

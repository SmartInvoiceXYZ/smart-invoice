import {
  Button,
  Flex,
  Text,
  Heading,
  IconButton,
  Image as ChakraImage,
  chakra,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { withRouter, Link as RouterLink } from 'react-router-dom';
import { useTable, useSortBy, usePagination, useRowSelect } from 'react-table';
import { Loader } from './Loader';
import { SearchContext, SearchContextProvider } from '../context/SearchContext';
import { Web3Context } from '../context/Web3Context';
import { useInvoiceStatus } from '../hooks/useInvoiceStatus';
import { Container } from '../shared/Container';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { theme } from '../theme';
import { dateTimeToDate, getTokenInfo, getHexChainId } from '../utils/helpers';
import { unixToDateTime } from '../utils/invoice';
import { formatUnits } from 'ethers/lib/utils';
import { VerticalDotsIcon } from '../icons/VerticalDots';
import { RightArrowIcon, LeftArrowIcon } from '../icons/ArrowIcons';
import { Styles } from '../pages/InvoicesStyles';
import { GenerateInvoicePDFMenuItem } from './GenerateInvoicePDF';
import { FilterIcon } from '../icons/FilterIcon';

const InvoiceStatusLabel = ({ invoice, ...props }) => {
  const { funded, label, loading } = useInvoiceStatus(invoice);
  const { isLocked, terminationTime } = invoice;
  const terminated = terminationTime > Date.now();
  const disputeResolved = label === 'Dispute Resolved';

  return (
    <Flex
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
      {...props}
    >
      <Text color="white" fontWeight="bold" textAlign="center" fontSize="15px">
        {loading ? <Loader size="20" /> : label}
      </Text>
    </Flex>
  );
};

export function InvoiceDashboardTable({ result, tokenData, chainId, history }) {
  const data = useMemo(() => {
    const dataArray = [];
    result.forEach((invoice, index) => {
      const { decimals, symbol, image } = getTokenInfo(
        chainId,
        invoice.token,
        tokenData,
      );
      const viewInvoice = () =>
        history.push(
          `/invoice/${getHexChainId(invoice.network)}/${invoice.address}`,
        );
      const details = {
        createdAt: dateTimeToDate(unixToDateTime(invoice.createdAt)),
        projectName: (
          <Link
            href={`/invoice/${getHexChainId(invoice.network)}/${
              invoice.address
            }`}
          >
            {invoice.projectName}
          </Link>
        ),
        amount: formatUnits(invoice.total, decimals),
        currency: (
          <Flex justify="center" gap={1}>
            <ChakraImage
              src={image}
              width="24px"
              height="24px"
              objectFit="cover"
            />
            <Text>{symbol}</Text>
          </Flex>
        ),
        status: (
          <InvoiceStatusLabel
            invoice={invoice}
            onClick={viewInvoice}
            cursor="pointer"
          />
        ),
        action: (
          <Menu>
            <MenuButton padding={0} width="fit-content">
              <VerticalDotsIcon />
            </MenuButton>
            <MenuList backgroundColor="white" textColor="black">
              <MenuItem
                _active={{
                  backgroundColor: 'rgba(61, 136, 248, 0.8)',
                  color: 'white',
                }}
                _hover={{
                  backgroundColor: 'rgba(61, 136, 248, 0.8)',
                  color: 'white',
                }}
                onClick={viewInvoice}
              >
                Manage
              </MenuItem>
              <GenerateInvoicePDFMenuItem
                invoice={invoice}
                symbol={symbol}
                text="Download"
                _active={{
                  backgroundColor: 'rgba(61, 136, 248, 0.8)',
                  color: 'white',
                }}
                _hover={{
                  backgroundColor: 'rgba(61, 136, 248, 0.8)',
                  color: 'white',
                }}
              />
            </MenuList>
          </Menu>
        ),
      };
      dataArray.push(details);
    });
    return dataArray;
  }, [chainId, result, tokenData, history]);

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
        isnumeric: 'true',
      },
      {
        Header: 'Currency',
        accessor: 'currency',
        isnumeric: 'true',
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
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 },
    },
    useSortBy,
    usePagination,
  );

  // cell props and getCellProps for individual cell control styling
  return (
    <Styles>
      <HStack justify="space-between" align="center" mb={8}>
        <Heading textAlign="left" color="#192A3E">
          My Invoices
        </Heading>
        <Button
          backgroundColor="blue.1"
          _hover={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          _active={{ backgroundColor: 'rgba(61, 136, 248, 0.7)' }}
          color="white"
          onClick={() => history.push('/create')}
        >
          Create invoice
        </Button>
      </HStack>
      <div className="tableWrap">
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, i) => (
                  <th
                    {...column.getHeaderProps({
                      className: column.collapse ? 'collapse' : '',
                    })}
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    isnumeric={column.isnumeric}
                  >
                    <Text textColor={column.isSorted ? 'black' : 'blue.dark'}>
                      {column.render('Header')}
                      {i !== headerGroup.headers.length - 1 && (
                        <chakra.span pl="4">
                          <FilterIcon width="8px" height="8px" />
                        </chakra.span>
                      )}
                    </Text>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, i) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell, index) => {
                    return (
                      <td
                        // Change cell formatting here most likely through targeting getCellProps with a function
                        // docs for react-table
                        {...cell.getCellProps({
                          className: cell.column.collapse ? 'collapse' : '',
                          // style: {backgroundColor: 'green'},
                        })}
                      >
                        {/* {console.log("cell props", cell.column.Header)} */}
                        {/* {console.log("cell:", cell)} */}
                        {cell.render('Cell')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <IconButton
          icon={<LeftArrowIcon />}
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
        />
        <span>
          Page {pageIndex + 1} of {pageCount}
        </span>
        <IconButton
          icon={<RightArrowIcon />}
          onClick={() => nextPage()}
          disabled={!canNextPage}
        />
      </div>
    </Styles>
  );
}

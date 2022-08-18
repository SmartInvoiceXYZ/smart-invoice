import { Button, Flex, Text, IconButton, chakra } from '@chakra-ui/react';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { withRouter } from 'react-router-dom';
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
import { Styles } from '../pages/InvoicesStyles';

const InvoiceStatusLabel = ({ invoice }) => {
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

const GoToInvoice = ({ invoice, history }) => {
  return (
    <Button
      size="lg"
      boxShadow="md"
      borderRadius="50"
      onClick={() =>
        history.push(
          `/invoice/${getHexChainId(invoice.network)}/${invoice.address}`,
        )
      }
      _hover={{
        bgColor: 'white',
        border: '1px',
        borderColor: 'gray.200',
      }}
      _active={{
        bgColor: 'white20',
      }}
      px={{ base: '0.5rem', md: '1rem' }}
    >
      View Invoice
    </Button>
  );
};

export function InvoiceDashboardTable({ result, tokenData, chainId, history }) {
  const data = useMemo(() => {
    const dataArray = [];
    result.forEach((invoice, index) => {
      const { decimals, symbol } = getTokenInfo(
        chainId,
        invoice.token,
        tokenData,
      );
      const details = {
        viewInvoice: <GoToInvoice invoice={invoice} history={history} />,
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
        Header: 'View Invoice',
        accessor: 'viewInvoice',
      },
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
      <div className="tableWrap">
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps({
                      className: column.collapse ? 'collapse' : '',
                    })}
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    isnumeric={column.isnumeric}
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
                  {row.cells.map(cell => {
                    return (
                      <td
                        {...cell.getCellProps({
                          className: cell.column.collapse ? 'collapse' : '',
                        })}
                      >
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
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </Styles>
  );
}

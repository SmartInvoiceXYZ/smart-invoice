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
  Badge,
} from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { Loader } from './Loader';
import { useInvoiceStatus } from '../hooks/useInvoiceStatus';
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
        loading
          ? '#FFFFFF'
          : terminated || disputeResolved || label === 'Expired'
          ? '#C2CFE0'
          : isLocked
          ? '#F7685B'
          : label === 'Overdue'
          ? '#F7685B'
          : funded
          ? '#2ED47A'
          : '#FFB946'
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

const InvoiceBadge = ({ invoice }) => {
  const { invoiceType } = invoice;
  const schemes = {
    escrow: {
      bg: 'rgba(128, 63, 248, 0.3)',
      color: 'rgba(128, 63, 248, 1)',
    },
    instant: {
      bg: 'rgba(248, 174, 63, 0.3)',
      color: 'rgba(248, 174, 63, 1)',
    },
    unknown: {
      bg: 'rgba(150,150,150,0.3)',
      color: 'rgba(150,150,150,1)',
    },
  };

  return (
    <Badge
      backgroundColor={schemes[invoiceType ?? 'unknown'].bg}
      color={schemes[invoiceType ?? 'unknown'].color}
      maxW="fit-content"
      height="fit-content"
    >
      {invoiceType ? invoiceType.toUpperCase() : 'UNKNOWN'}
    </Badge>
  );
};

export function InvoiceDashboardTable({ result, tokenData, chainId, history }) {
  const data = useMemo(() => {
    const dataArray = [];
    result.forEach(invoice => {
      const { decimals, symbol, image } = getTokenInfo(
        chainId,
        invoice.token,
        tokenData,
      );
      const viewInvoice = () =>
        history.push(
          `/invoice/${getHexChainId(invoice.network)}/${invoice.address}/${
            invoice.invoiceType !== 'escrow' ? invoice.invoiceType : ''
          }`,
        );
      const details = {
        createdAt: dateTimeToDate(unixToDateTime(invoice.createdAt)),
        projectName: (
          <Flex
            gap={2}
            width="100%"
            align="center"
            justify="space-between"
            onClick={viewInvoice}
          >
            <Link
              href={`/invoice/${getHexChainId(invoice.network)}/${
                invoice.address
              }/${invoice.invoiceType !== 'escrow' ? invoice.invoiceType : ''}`}
            >
              {invoice.projectName}
            </Link>
            <InvoiceBadge invoice={invoice} />
          </Flex>
        ),
        amount: formatUnits(invoice.total, decimals),
        currency: (
          <Flex justify="left" gap={2}>
            <ChakraImage
              src={image}
              width="24px"
              height="24px"
              objectFit="contain"
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
    pageCount,
    nextPage,
    previousPage,
    state: { pageIndex },
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
          Create Invoice
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
                    className={
                      column.Header === 'Amount'
                        ? 'noAmount'
                        : column.Header === 'Currency'
                        ? 'noCurrency'
                        : column.Header === 'Date Created'
                        ? 'noDate'
                        : null
                    }
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
            {page.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return (
                      <td
                        // Change cell formatting here most likely through targeting getCellProps with a function
                        // docs for react-table
                        {...cell.getCellProps({
                          className: cell.column.collapse ? 'collapse' : '',
                        })}
                        className={
                          cell.column.id === 'amount'
                            ? 'noAmount'
                            : cell.column.id === 'currency'
                            ? 'noCurrency'
                            : cell.column.id === 'createdAt'
                            ? 'noDate'
                            : null
                        }
                      >
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

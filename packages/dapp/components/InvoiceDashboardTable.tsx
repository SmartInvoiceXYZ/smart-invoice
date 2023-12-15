import { useRouter } from 'next/router';
import React, { useMemo } from 'react';

/* eslint-disable no-nested-ternary */
import { Button, Flex, HStack, Heading, IconButton } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  PaginationState,
  SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { ChainId } from '../constants/config';
import { InvoiceRow } from '../context/SearchContext';
import { LeftArrowIcon, RightArrowIcon } from '../icons/ArrowIcons';
import { TokenData } from '../types';
import { Styles } from './InvoicesStyles';

export type InvoiceDashboardTableProps = {
  result: InvoiceRow[];
  tokenData: Record<ChainId, Record<string, TokenData>>;
  chain?: ChainId;
};

export const InvoiceDashboardTable: React.FC<InvoiceDashboardTableProps> = ({
  result,
  tokenData,
  chain,
}) => {
  const router = useRouter();

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<InvoiceRow>();

    return [
      columnHelper.accessor('createdAt', {
        header: 'Date Created',
        cell: info => info.getValue(),
        footer: info => info.column.id,
      }),
      columnHelper.accessor('projectName', {
        header: 'Invoice Name/ID',
        cell: info => info.getValue(),
        footer: info => info.column.id,
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: info => info.getValue(),
        footer: info => info.column.id,
      }),
      columnHelper.accessor('currency', {
        header: 'Currency',
        cell: info => info.getValue(),
        footer: info => info.column.id,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => info.getValue(),
        footer: info => info.column.id,
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: info => info.getValue(),
        footer: info => info.column.id,
      }),
    ];
  }, []);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });

  const fetchDataOptions = {
    pageIndex,
    pageSize,
  };

  const dataQuery = useQuery(
    ['data', fetchDataOptions],
    () => fetchData(fetchDataOptions),
    { keepPreviousData: true },
  );

  const defaultData = useMemo(() => [], []);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const table = useReactTable({
    data: dataQuery.data?.rows ?? defaultData,
    columns,
    pageCount: dataQuery.data?.pageCount ?? -1,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    debugTable: true,
  });

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
          onClick={() => router.push('/create')}
        >
          Create Invoice
        </Button>
      </HStack>
      <div className="tableWrap">
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {table.getFooterGroups().map(footerGroup => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
      <div className="pagination">
        <IconButton
          aria-label="First Page"
          icon={
            <Flex direction="column">
              <LeftArrowIcon />
              <LeftArrowIcon />
            </Flex>
          }
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        />
        <IconButton
          aria-label="Previous Page"
          icon={<LeftArrowIcon />}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        />
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <IconButton
          aria-label="Next Page"
          icon={<RightArrowIcon />}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        />
        <IconButton
          aria-label="Last Page"
          icon={
            <Flex direction="column">
              <RightArrowIcon />
              <RightArrowIcon />
            </Flex>
          }
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        />
      </div>
    </Styles>
  );
};

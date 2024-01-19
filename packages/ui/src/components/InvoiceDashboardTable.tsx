/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';

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
import { Address, formatUnits } from 'viem';

import { LeftArrowIcon, RightArrowIcon } from '../icons/ArrowIcons';
import { Styles } from './InvoicesStyles';
import {
  // Invoice_orderBy,
  fetchInvoices,
  Invoice,
} from '@smart-invoice/graphql';

export type SearchInputType = string | Address | undefined;

export type InvoiceDashboardTableProps = {
  chainId?: number;
  searchInput?: SearchInputType;
  onLoading?: (isLoading: boolean, resultCount?: number) => void;
};

export const InvoiceDashboardTable: React.FC<InvoiceDashboardTableProps> = ({
  chainId,
  searchInput,
  onLoading = () => {},
}) => {
  const router = useRouter();

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Invoice>();

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
      columnHelper.accessor(
        row => formatUnits(row.total, row.tokenMetadata?.decimals),
        {
          id: 'amount',
          header: 'Amount',
          cell: info => info.getValue(),
          footer: info => info.column.id,
        },
      ),
      columnHelper.accessor(row => row.tokenMetadata?.symbol, {
        id: 'currency',
        header: 'Currency',
        cell: info => info.getValue(),
        footer: info => info.column.id,
      }),
      columnHelper.accessor('released', {
        header: 'Released',
        cell: info => info.getValue(),
        footer: info => info.column.id,
      }),
      // columnHelper.accessor('action', { // TODO: clear up what this column is for? not on GQL schema...
      //   header: 'Action',
      //   cell: info => info.getValue(),
      //   footer: info => info.column.id,
      // }),
    ];
  }, []);

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchDataOptions: [
    number,
    SearchInputType,
    number,
    number,
    any, // Invoice_orderBy,
    boolean,
    (isLoading: boolean, resultCount?: number) => void,
  ] = useMemo(
    () => [
      chainId || -1,
      searchInput,
      pageIndex,
      pageSize,
      sorting[0].id as any, // Invoice_orderBy,
      sorting[0].desc,
      onLoading,
    ],
    [chainId, onLoading, pageIndex, pageSize, searchInput, sorting],
  );

  const dataQuery = useQuery({
    queryKey: ['invoices', ...fetchDataOptions],
    queryFn: () => fetchInvoices(...fetchDataOptions),
  });

  const defaultData = useMemo(() => [], []);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const table = useReactTable({
    data: dataQuery.data ?? defaultData,
    columns,
    pageCount: Math.ceil(dataQuery.status.length / pageSize) ?? -1,
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

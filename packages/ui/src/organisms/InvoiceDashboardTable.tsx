/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable camelcase */
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import {
  fetchInvoices,
  Invoice_orderBy,
  InvoiceDetails,
} from '@smart-invoice/graphql';
import { chainsMap } from '@smart-invoice/utils';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  CellContext,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { Address, formatUnits, Hex } from 'viem';

import { AccountLink, ChakraNextLink, theme, useMediaStyles } from '..';
import {
  DoubleLeftArrowIcon,
  LeftArrowIcon,
  RightArrowIcon,
} from '../icons/ArrowIcons';
import { Styles } from '../molecules/InvoicesStyles';
import { useIpfsDetails } from '@smart-invoice/hooks/src';

// TODO use `usePaginatedQuery`

export type SearchInputType = string | Address | undefined;

export type InvoiceDashboardTableProps = {
  chainId?: number;
  searchInput?: SearchInputType;
};

function InvoiceLink({
  cell,
  chainId,
}: {
  cell: CellContext<InvoiceDetails & { ipfsHash: string }, string | undefined>;
  chainId?: number;
}) {
  const { ipfsHash } = cell.row.original;
  const address = cell.getValue();
  const { data, isFetched } = useIpfsDetails({ cid: ipfsHash });

  return data && isFetched ? (
    <ChakraNextLink href={`/invoice/${chainId?.toString(16)}/${address}`}>
      {data?.projectName}
    </ChakraNextLink>
  ) : (
    <AccountLink
      address={address as Hex}
      link={`/invoice/${chainId?.toString(16)}/${address}`}
    />
  );
}

export function InvoiceDashboardTable({
  chainId,
  searchInput,
}: InvoiceDashboardTableProps) {
  const router = useRouter();

  const { primaryButtonSize } = useMediaStyles();
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<InvoiceDetails>();

    return [
      columnHelper.accessor('createdAt', {
        header: 'Date Created',
        cell: info => new Date(Number(info.getValue()) * 1000).toLocaleString(),
      }),
      columnHelper.accessor('address', {
        header: 'Invoice Name/ID',
        cell: info => <InvoiceLink cell={info} chainId={chainId} />,
      }),
      columnHelper.accessor(
        row =>
          row?.total &&
          formatUnits(row.total, row.tokenMetadata?.decimals || 18),
        {
          id: 'amount',
          header: 'Amount',
          cell: info => info.getValue(),
          meta: 'total',
        },
      ),
      columnHelper.accessor(row => row?.tokenMetadata?.symbol, {
        id: 'currency',
        header: 'Currency',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor(
        row =>
          row?.released &&
          formatUnits(row.released, row.tokenMetadata?.decimals || 18),
        {
          id: 'released',
          header: 'Released',
          cell: info => info.getValue(),
        },
      ),
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
    Invoice_orderBy,
    boolean,
  ] = useMemo(
    () => [
      chainId || -1,
      searchInput,
      pageIndex,
      pageSize,
      sorting[0].id as Invoice_orderBy,
      sorting[0].desc,
    ],
    [chainId, pageIndex, pageSize, searchInput, sorting],
  );

  const defaultData = useMemo(() => [], []);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', ...fetchDataOptions],
    queryFn: () => fetchInvoices(...fetchDataOptions),
    enabled: !!chainId && !!searchInput,
    placeholderData: keepPreviousData,
  });

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const table = useReactTable({
    data: data ?? (defaultData as any[]),
    columns,
    pageCount: -1,
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

  if (isLoading) {
    return (
      <Box paddingY={16}>
        <Stack align="center">
          <Heading color="gray" as="h1">
            Invoices Loading
          </Heading>
          <Spinner />
        </Stack>
      </Box>
    );
  }

  if (!data?.length) {
    return (
      <Box paddingY={16}>
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={4}
          width="100%"
        >
          {chainId ? (
            <Heading color="gray" size="lg">
              No invoices found on {chainsMap(chainId)?.name}.
            </Heading>
          ) : (
            <Heading color="gray" size="lg">
              Wallet not connected.
            </Heading>
          )}

          <ChakraNextLink href="/create">
            <Button size={primaryButtonSize} minW="250px" paddingY={6}>
              Create Invoice
            </Button>
          </ChakraNextLink>
        </Flex>
      </Box>
    );
  }

  return (
    <Box paddingY={16} flex="1 0 100%">
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
          <Table>
            <Thead>
              {table.getHeaderGroups().map(headerGroup => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <Th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
            <Tbody>
              {table.getRowModel().rows.map(row => (
                <Tr
                  key={row.id}
                  onClick={() =>
                    router.push(
                      `/invoice/${chainId?.toString(16)}/${row.getValue('address')}`,
                    )
                  }
                  _hover={{ backgroundColor: theme.gray, cursor: 'pointer' }}
                >
                  {row.getVisibleCells().map(cell => (
                    <Td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
        <div className="pagination">
          <IconButton
            aria-label="First Page"
            icon={<DoubleLeftArrowIcon />}
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
          />
          <IconButton
            aria-label="Previous Page"
            icon={<LeftArrowIcon />}
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          />
          <Text>Page {table.getState().pagination.pageIndex + 1}</Text>
          {data?.length >= table.getState().pagination.pageSize ? (
            <IconButton
              aria-label="Next Page"
              disabled={data?.length < table.getState().pagination.pageSize}
              icon={<RightArrowIcon />}
              onClick={() => table.nextPage()}
            />
          ) : null}
        </div>
      </Styles>
    </Box>
  );
}

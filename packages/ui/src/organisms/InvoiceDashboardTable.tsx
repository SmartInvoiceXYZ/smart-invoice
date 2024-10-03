import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { InvoiceDisplayData } from '@smartinvoicexyz/graphql';
import { useInvoices, useIpfsDetails } from '@smartinvoicexyz/hooks';
import {
  chainByName,
  getAccountString,
  getChainName,
  getDateTimeString,
} from '@smartinvoicexyz/utils';
import {
  CellContext,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, useChainId } from 'wagmi';

import { ChakraNextLink, Loader } from '../atoms';
import { useMediaStyles } from '../hooks';
import { Styles } from '../molecules/InvoicesStyles';
import { theme } from '../theme';

function InvoiceDisplay({
  cell,
}: {
  cell: CellContext<InvoiceDisplayData, string | undefined>;
}) {
  const { ipfsHash, address } = cell.row.original;

  const { data } = useIpfsDetails(ipfsHash);

  return data?.title || data?.projectName || getAccountString(address);
}

const columnHelper = createColumnHelper<InvoiceDisplayData>();

export function InvoiceDashboardTable() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { primaryButtonSize } = useMediaStyles();

  // TODO: implement pagination
  const [page] = useState(0);

  const { data, isLoading } = useInvoices({
    page,
  });

  const table = useReactTable({
    data: data || [],
    columns: [
      columnHelper.accessor('address', {
        header: 'Title',
        // eslint-disable-next-line react/no-unstable-nested-components
        cell: info => <InvoiceDisplay cell={info} />,
      }),
      columnHelper.accessor('invoiceType', {
        header: 'Type',
        cell: info => _.capitalize(info.getValue()),
      }),
      columnHelper.accessor(
        row => {
          const { provider, client, resolver } = row;
          if (_.toLower(address) === _.toLower(client)) {
            return 'Client';
          }
          if (_.toLower(address) === _.toLower(provider)) {
            return 'Provider';
          }
          if (_.toLower(address) === _.toLower(resolver)) {
            return 'Resolver';
          }
          return 'Unknown';
        },
        {
          header: 'Role',
          cell: info => info.getValue(),
        },
      ),
      columnHelper.accessor(
        row => {
          const value = formatUnits(
            row.total ?? BigInt(0),
            row.tokenMetadata?.decimals || 18,
          );
          const symbol = row.tokenMetadata?.symbol;
          return `${value} ${symbol}`;
        },
        {
          id: 'total',
          header: 'Total',
          cell: info => info.getValue(),
        },
      ),
      columnHelper.accessor(
        row => {
          const value = formatUnits(
            row.released ?? BigInt(0),
            row.tokenMetadata?.decimals || 18,
          );
          const symbol = row.tokenMetadata?.symbol;
          return `${value} ${symbol}`;
        },
        {
          id: 'released',
          header: 'Released',
          cell: info => info.getValue(),
        },
      ),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: info => getDateTimeString(info.getValue()),
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  if (isLoading) {
    return (
      <Box paddingY={16}>
        <Stack align="center">
          <Loader size="80" />
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
          {isConnected ? (
            <Heading color="gray" size="lg">
              No invoices found for {getChainName(chainId)}!
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
        <Table bg="white">
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
            {table.getRowModel().rows.map(row => {
              const { address: invoiceAddr, network } = row.original;
              const url = `/invoice/${chainByName(network)?.id?.toString(16)}/${invoiceAddr}`;

              return (
                <Tr
                  key={row.id}
                  onClick={() => router.push(url)}
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
              );
            })}
          </Tbody>
          {/*
          <TableCaption w="100%">
            <HStack w="100%" justify="center">
              <IconButton
                aria-label="First Page"
                icon={<DoubleLeftArrowIcon />}
              //onClick={() => setPage(0)}
              />
              <IconButton
                aria-label="Previous Page"
                icon={<LeftArrowIcon />}
                disabled={!table.getCanPreviousPage()}
              //onClick={() => table.previousPage()}
              />
              <Text>Page {page + 1}</Text>
              {data?.length >= table.getState().pagination.pageSize ? (
                <IconButton
                  aria-label="Next Page"
                  disabled={data?.length < table.getState().pagination.pageSize}
                  icon={<RightArrowIcon />}
                  onClick={() => table.nextPage()}
                />
              ) : null}

            </HStack>
          </TableCaption>
          */}
        </Table>
      </Styles>
    </Box>
  );
}

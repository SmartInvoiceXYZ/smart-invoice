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
  getDateTimeString,
} from '@smartinvoicexyz/utils';
import {
  CellContext,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Address, formatUnits } from 'viem';
import { useAccount } from 'wagmi';

import { ChakraNextLink, Loader } from '../atoms';
import { useMediaStyles } from '../hooks';
import { Styles } from '../molecules/InvoicesStyles';
import { theme } from '../theme';

function InvoiceDisplay({
  cell,
}: {
  cell: CellContext<InvoiceDisplayData, string | undefined>;
}) {
  const { ipfsHash } = cell.row.original;
  const address = cell.getValue();

  const { data } = useIpfsDetails(ipfsHash ?? '');

  const displayString =
    data?.title || getAccountString(address as Address | undefined);

  return displayString;
}

export function InvoiceDashboardTable() {
  const router = useRouter();
  const { isConnected } = useAccount();

  const { primaryButtonSize } = useMediaStyles();
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<InvoiceDisplayData>();

    return [
      columnHelper.accessor('createdAt', {
        header: 'Date Created',
        cell: info => getDateTimeString(info.getValue()),
      }),
      columnHelper.accessor('network', {
        header: 'Chain',
        cell: info => {
          const chain = chainByName(info.getValue());
          return chain?.name;
        },
      }),
      columnHelper.accessor('address', {
        header: 'Invoice Name/ID',
        // eslint-disable-next-line react/no-unstable-nested-components
        cell: info => <InvoiceDisplay cell={info} />,
      }),
      columnHelper.accessor(
        row => {
          if (row?.total) {
            return formatUnits(row.total, row.tokenMetadata?.decimals || 18);
          }

          return '0';
        },
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

  const { data, isLoading } = useInvoices({
    page: 0,
  });

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    debugTable: true,
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
              No invoices found!
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
              const chainId = chainByName(network)?.id;
              const url = `/invoice/${chainId?.toString(16)}/${invoiceAddr}`;

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
        </Table>
      </Styles>
    </Box>
  );
}

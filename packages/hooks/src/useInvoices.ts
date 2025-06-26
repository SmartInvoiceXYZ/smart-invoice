/* eslint-disable camelcase */
import {
  fetchInvoices,
  Invoice_orderBy,
  InvoiceDisplayData,
} from '@smartinvoicexyz/graphql';
import { parseToDate } from '@smartinvoicexyz/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Address } from 'viem';
import { useAccount, useChainId } from 'wagmi';

const calcTotal = (amounts: { amount: bigint }[] | undefined) => {
  if (!amounts) return undefined;
  return amounts.reduce((sum, a) => {
    return sum + BigInt(a.amount.toString());
  }, BigInt(0));
};

const totalAmount = (amounts: bigint[]) => {
  return amounts.reduce((sum, a) => {
    return sum + BigInt(a);
  }, BigInt(0));
};

const totalDueReleases = ({
  releases,
  amounts,
}: {
  releases: { amount: bigint }[];
  amounts: bigint[];
}) => {
  const totalReleases = calcTotal(releases);
  const total = totalAmount(amounts);

  if (!totalReleases || !total) return undefined;
  return totalReleases > total ? BigInt(0) : BigInt(total) - totalReleases;
};

const PAGE_SIZE = 100;
const fetchInvoicesForPage = async (
  chainId: number,
  address: Address | undefined,
  page: number,
): Promise<Array<InvoiceDisplayData>> => {
  const invoices = await fetchInvoices(
    chainId,
    address,
    page,
    PAGE_SIZE,
    Invoice_orderBy.createdAt,
    true,
  );

  return invoices.map(invoice => {
    const totaDeposits = calcTotal(invoice.deposits);
    let status:
      | 'Locked'
      | 'Awaiting Funds'
      | 'In Progress'
      | 'Expired'
      | 'Completed' = 'Locked';
    if (invoice.isLocked !== true) {
      if (
        totalDueReleases({
          releases: invoice.releases,
          amounts: invoice.amounts,
        }) === BigInt(0)
      ) {
        status = 'Completed';
      } else if (
        invoice.terminationTime &&
        parseToDate(invoice.terminationTime) < new Date()
      ) {
        status = 'Expired';
      } else if ((totaDeposits ?? BigInt(0)) < BigInt(invoice.amounts[0])) {
        status = 'Awaiting Funds';
      } else {
        status = 'In Progress';
      }
    }
    return {
      ...invoice,
      status,
    };
  });
};

const QUERY_KEY_INVOICES = 'invoices';

export const createInvoicesQueryKey = (
  chainId: number | undefined,
  address: Address | undefined,
  page: number,
) => [QUERY_KEY_INVOICES, address?.toLowerCase(), chainId, page];

export const useInvoices = ({ page }: { page: number }) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const result = useQuery({
    queryKey: createInvoicesQueryKey(chainId, address, page),
    queryFn: () => fetchInvoicesForPage(chainId, address, page),
    enabled: !!address && !!chainId,
  });

  return result;
};

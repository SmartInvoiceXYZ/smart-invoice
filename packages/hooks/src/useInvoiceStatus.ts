import { Invoice } from '@smart-invoice/graphql';
import {
  balanceOf,
  getDeadline,
  getTotalFulfilled,
  logError,
} from '@smart-invoice/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Hex, isAddress } from 'viem';
import { Chain, useChainId } from 'wagmi';

async function fetchInstantInfo(chainId: number, invoiceAddress: Hex) {
  try {
    const deadline = await getDeadline(chainId, invoiceAddress);
    const fulfilled = await getTotalFulfilled(chainId, invoiceAddress);
    return {
      deadline: 10,
      isFulfilled: true, // fulfilled.isFulfilled,
      fulfilledAmount: 10, // fulfilled.amount,
    };
  } catch (instantFetchError) {
    logError({ instantFetchError });
    return undefined;
  }
}

interface FetchInvoiceStatus {
  chainId: number;
  invoice: Partial<Invoice>;
}

const defaultReturn = { funded: false, label: 'Awaiting Deposit' };

const fetchInvoiceStatus = async ({ chainId, invoice }: FetchInvoiceStatus) => {
  const {
    currentMilestone,
    amounts,
    token,
    address,
    isLocked,
    terminationTime,
    disputes,
    resolutions,
    deposits,
    invoiceType,
  } = _.pick(invoice, [
    'currentMilestone',
    'amounts',
    'token',
    'address',
    'isLocked',
    'terminationTime',
    'disputes',
    'resolutions',
    'deposits',
    'invoiceType',
  ]);

  const validAddress = address && isAddress(address) && address;
  const validToken = token && isAddress(token) && token;
  if (!validAddress || !validToken) return defaultReturn;

  if (invoiceType === 'escrow') {
    console.log('test');
    try {
      // TODO fetch balance
      const balance = 0;

      if (Number(currentMilestone) === _.size(amounts)) {
        if (
          _.size(disputes) === _.size(resolutions) &&
          !_.isEmpty(resolutions)
        ) {
          return { funded: true, label: 'Dispute Resolved' };
        }
        return { funded: true, label: 'Completed' };
      }
      const naiveAmount = amounts?.[Number(currentMilestone)];
      const amount = naiveAmount && BigInt(naiveAmount);
      if (amount && !_.isEmpty(deposits) && balance < amount) {
        return { funded: !isLocked, label: 'Partially Funded' };
      }
      if (amount && balance >= amount) {
        return { funded: !isLocked, label: 'Funded' };
      }
      if (terminationTime && terminationTime <= new Date().getTime() / 1000) {
        return { funded: true, label: 'Expired' };
      }
      if (isLocked) return { funded: true, label: 'In Dispute' };
    } catch (statusError) {
      logError({ statusError });
      return defaultReturn;
    }

    return defaultReturn;
  }

  try {
    const result = await fetchInstantInfo(chainId, validAddress);

    if (result?.isFulfilled) {
      return { funded: true, label: 'Completed' };
    }
    if (!_.isEmpty(deposits)) {
      return { funded: true, label: 'Partially Funded' };
    }
    if (result?.deadline && result.deadline <= new Date().getTime() / 1000) {
      return { funded: false, label: 'Overdue' };
    }
  } catch (statusError) {
    logError({ statusError });
    return { funded: false, label: 'Error occurred' };
  }

  return defaultReturn;
};

export const useInvoiceStatus = (invoice: Invoice) => {
  const chainId = useChainId();

  const { data, isLoading } = useQuery({
    queryKey: ['invoiceStatus', { chainId, invoice }],
    queryFn: () =>
      fetchInvoiceStatus({
        chainId,
        invoice,
      }),
    enabled: !!chainId && !!invoice,
  });

  return { data, isLoading };
};

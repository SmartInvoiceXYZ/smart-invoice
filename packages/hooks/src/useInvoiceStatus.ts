import { INVOICE_TYPES } from '@smartinvoicexyz/constants';
import { InstantDetails, InvoiceDetails } from '@smartinvoicexyz/graphql';
import { logError } from '@smartinvoicexyz/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Hex, isAddress } from 'viem';
import { useChainId } from 'wagmi';

import { useInstantDetails } from '.';

interface FetchInvoiceStatus {
  invoice: Partial<InvoiceDetails>;
  instantInfo: InstantDetails | undefined;
}

const defaultReturn = { funded: false, label: 'Awaiting Deposit' };

const fetchInvoiceStatus = async ({
  invoice,
  instantInfo,
}: FetchInvoiceStatus) => {
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
    tokenBalance,
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
    'tokenBalance',
  ]);

  const validAddress = address && isAddress(address) && address;
  const validToken = token && isAddress(token) && token;
  if (!validAddress || !validToken) return defaultReturn;

  if (invoiceType === INVOICE_TYPES.Escrow) {
    try {
      const balance = tokenBalance?.value || BigInt(0);

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
    if (instantInfo?.fulfilled) {
      return { funded: true, label: 'Completed' };
    }
    if (!_.isEmpty(deposits)) {
      return { funded: true, label: 'Partially Funded' };
    }
    if (
      instantInfo?.deadline &&
      instantInfo.deadline <= new Date().getTime() / 1000
    ) {
      return { funded: false, label: 'Overdue' };
    }
  } catch (statusError) {
    logError({ statusError });
    return { funded: false, label: 'Error occurred' };
  }

  return defaultReturn;
};

export const useInvoiceStatus = ({ invoice }: { invoice: InvoiceDetails }) => {
  const chainId = useChainId();

  const { data: instantInfo } = useInstantDetails({
    address: _.get(invoice, 'address') as Hex,
    chainId,
    enabled: !!chainId && !!invoice,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['invoiceStatus', { chainId, invoice }],
    queryFn: () =>
      fetchInvoiceStatus({
        invoice,
        instantInfo,
      }),
    enabled: !!chainId && !!invoice,
  });

  return { data, isLoading };
};

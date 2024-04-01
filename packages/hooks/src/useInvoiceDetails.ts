import useSWR from 'swr';
import { fetchInvoice, Invoice, InvoiceDetails } from '@smart-invoice/graphql';
import { getInvoiceDetails } from '@smart-invoice/utils';
import _ from 'lodash';
import { Hex } from 'viem';
import { useToken, useBalance } from 'wagmi';
import { INVOICE_TYPES } from '@smart-invoice/constants';

import { useInstantDetails } from '.';

// Define a fetcher function that calls your fetchInvoice method.
const fetcher = (chainId, address) => fetchInvoice(chainId, address);

export const useInvoiceDetails = ({ address, chainId }: { address: Hex; chainId: number }) => {
  // Replace useQuery with useSWR for fetching invoice details.
  const { data: invoice, error } = useSWR<Invoice>(
    address && chainId ? ['invoiceDetails', chainId, address] : null,
    () => fetcher(chainId, address),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000 * 60 * 15 // 15 minutes
    }
  );

  const { invoiceType: type } = _.pick(invoice, ['invoiceType']);

  // Use existing hooks for token metadata and balances.
  const { data: tokenMetadata } = useToken({
    address: invoice?.token as Hex,
    chainId,
    enabled: !!address && !!chainId,
  });

  const { data: nativeBalance } = useBalance({ address });
  const { data: tokenBalance } = useBalance({
    address,
    token: invoice?.token as Hex,
    chainId,
    enabled: !!invoice?.token && !!chainId,
  });

  const { data: instantDetails } = useInstantDetails({
    address,
    chainId,
    enabled: !!address && !!chainId && type === INVOICE_TYPES.Instant,
  });

  // Enhanced invoice details are fetched with SWR as well.
  const { data: invoiceDetails, isValidating: isInvoiceDetailsLoading } = useSWR<InvoiceDetails | null>(
    invoice && tokenMetadata && tokenBalance && nativeBalance && (type !== INVOICE_TYPES.Instant || instantDetails)
      ? [
        'extendedInvoiceDetails',
        invoice?.id,
        tokenMetadata?.name,
        tokenBalance?.formatted,
        nativeBalance?.formatted,
        _.mapValues(instantDetails, v => v?.toString())
      ]
      : null,
    () => getInvoiceDetails(invoice, tokenMetadata, tokenBalance, nativeBalance, instantDetails),
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000 * 60 * 15 // 15 minutes
    }
  );

  return {
    data: invoice,
    invoiceDetails,
    isLoading: !invoice && !error,
    isInvoiceDetailsLoading,
    error,
  };
};

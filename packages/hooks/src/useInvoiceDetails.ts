import { INVOICE_TYPES } from '@smart-invoice/constants';
import { fetchInvoice, Invoice, InvoiceDetails } from '@smart-invoice/graphql';
import { getInvoiceDetails } from '@smart-invoice/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Hex } from 'viem';
import { useBalance, useToken } from 'wagmi';

import { useInstantDetails } from '.';

export const useInvoiceDetails = ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery<Invoice>({
    queryKey: ['invoiceDetails', { address, chainId }],
    queryFn: () => fetchInvoice(chainId, address),
    enabled: !!address && !!chainId,
    staleTime: 1000 * 60 * 15,
  });
  // console.log(invoice);

  const { invoiceType: type } = _.pick(invoice, ['invoiceType']);

  // fetch data about the invoice's token
  const { data: tokenMetadata } = useToken({
    address: invoice?.token as Hex,
    chainId,
    enabled: !!address && !!chainId,
  });

  // fetch the invoice's balances
  const { data: nativeBalance } = useBalance({ address });
  const { data: tokenBalance } = useBalance({
    address,
    token: invoice?.token as Hex,
    chainId,
    enabled: !!invoice?.token && !!chainId,
  });

  // fetch the invoice's instant details, if applicable
  const { data: instantDetails } = useInstantDetails({
    address,
    chainId,
    enabled: !!address && !!chainId && type === INVOICE_TYPES.Instant,
  });

  // enhance the invoice with assorted computed values
  const { data: invoiceDetails, isLoading: isInvoiceDetailsLoading } =
    useQuery<InvoiceDetails | null>({
      queryKey: [
        'extendedInvoiceDetails',
        {
          invoiceId: _.get(invoice, 'id'),
          token: tokenMetadata?.name,
          tokenBalance: tokenBalance?.formatted,
          nativeBalance: nativeBalance?.formatted,
          instantDetails: _.mapValues(instantDetails, v => v?.toString()),
        },
      ],
      queryFn: () =>
        getInvoiceDetails(
          invoice,
          tokenMetadata,
          tokenBalance,
          nativeBalance,
          instantDetails,
        ),
      enabled:
        !!invoice &&
        !!tokenMetadata &&
        !!tokenBalance &&
        !!nativeBalance &&
        type === INVOICE_TYPES.Instant
          ? !!instantDetails
          : true,

      staleTime: 1000 * 60 * 15,
    });

  return {
    data: invoice,
    invoiceDetails,
    isLoading: isLoading || isInvoiceDetailsLoading,
    error,
  };
};

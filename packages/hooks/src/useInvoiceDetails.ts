import {
  INVOICE_TYPES,
  KLEROS_ARBITRATION_SAFE,
} from '@smartinvoicexyz/constants';
import {
  cache,
  fetchInvoice,
  Invoice,
  InvoiceDetails,
} from '@smartinvoicexyz/graphql';
import { getInvoiceDetails, getResolverInfo } from '@smartinvoicexyz/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { formatUnits, Hex } from 'viem';
import { useBalance } from 'wagmi';

// import { useInstantDetails, useIpfsDetails, useTokenBalance, useTokenMetadata } from '.';
import { useInstantDetails } from './useInstantDetails';
import { useIpfsDetails } from './useIpfsDetails';
import { useTokenBalance, useTokenMetadata } from './useToken';

export const useInvoiceDetails = ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}): {
  invoiceDetails: Partial<InvoiceDetails>;
  isLoading: boolean;
  error: Error | null;
} => {
  cache.reset();
  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery<Invoice>({
    queryKey: ['invoiceDetails', { address, chainId }],
    queryFn: () => fetchInvoice(chainId, address),
    enabled: !!address && !!chainId,
  });

  const { invoiceType: type } = _.pick(invoice, ['invoiceType']);

  // fetch data about the invoice's token
  const { data: tokenMetadata } = useTokenMetadata({
    address: invoice?.token as Hex,
    chainId,
  });

  const { data: tokenBalanceNew } = useTokenBalance({
    address,
    tokenAddress: invoice?.token as Hex,
    chainId,
  });

  // fetch the invoice's balances
  const { data: nativeBalance, ...restNative } = useBalance({
    address,
    chainId,
  });

  const { data: tokenBalance } = useBalance({
    address,
    token: invoice?.token as Hex,
    chainId,
    query: {
      enabled: !!invoice?.token && !!chainId,
    },
  });

  console.log({
    nativeBalance,
    restNative,
    tokenBalance,
    tokenBalanceNew,
    tokenMetadata,
    invoice,
    type,
  });

  // fetch the invoice's instant details, if applicable
  const { data: instantDetails } = useInstantDetails({
    address,
    chainId,
    enabled: !!address && !!chainId && type === INVOICE_TYPES.Instant,
  });

  console.log(
    'is enabled',
    !!invoice &&
      !!tokenMetadata &&
      !!tokenBalance &&
      !!nativeBalance &&
      (type === INVOICE_TYPES.Instant ? !!instantDetails : true),
  );

  // enhance the invoice with assorted computed values
  const { data: invoiceDetails, isLoading: isInvoiceDetailsLoading } =
    useQuery<InvoiceDetails | null>({
      queryKey: [
        'extendedInvoiceDetails',
        {
          invoiceId: _.get(invoice, 'id'),
          token: tokenMetadata?.name,
          tokenBalance: tokenBalance
            ? formatUnits(tokenBalance.value, tokenBalance.decimals)
            : undefined,
          nativeBalance: nativeBalance
            ? formatUnits(nativeBalance.value, nativeBalance.decimals)
            : undefined,
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
    });

  // fetch invoice details from Ipfs
  // TODO: remove after subgraph is fixed
  const { data: ipfsDetails } = useIpfsDetails({
    cid: _.get(invoiceDetails, 'detailsHash', ''),
  });

  // if kleros court is set in ipfs details
  const klerosResolverInfo = getResolverInfo(
    KLEROS_ARBITRATION_SAFE as Hex,
    chainId,
  );
  // const klerosResolverFee = getResolverFee(invoice, tokenBalance);

  const enhancedInvoiceFromIpfs = {
    ...invoice,
    ...(ipfsDetails
      ? {
          projectName: ipfsDetails?.projectName,
          startDate: BigInt(
            typeof ipfsDetails?.startDate === 'string'
              ? Math.floor(new Date(ipfsDetails?.startDate).getTime() / 1000)
              : ipfsDetails?.startDate,
          ),
          endDate: BigInt(
            typeof ipfsDetails?.endDate === 'string'
              ? Math.floor(new Date(ipfsDetails?.endDate).getTime() / 1000)
              : ipfsDetails?.endDate,
          ),
          klerosCourt: ipfsDetails?.klerosCourt || undefined,
          resolverInfo: ipfsDetails?.klerosCourt
            ? klerosResolverInfo
            : invoiceDetails?.resolverInfo,
          resolverName: ipfsDetails?.klerosCourt
            ? klerosResolverInfo?.name
            : invoiceDetails?.resolverName,
          projectDescription: ipfsDetails?.projectDescription,
        }
      : {}),
    tokenMetadata,
  } as Partial<InvoiceDetails>;

  return {
    invoiceDetails: enhancedInvoiceFromIpfs,
    isLoading: isLoading || isInvoiceDetailsLoading,
    error,
  };
};

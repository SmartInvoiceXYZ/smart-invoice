import { INVOICE_TYPES } from '@smart-invoice/constants';
import {
  cache,
  fetchInvoice,
  Invoice,
  InvoiceDetails,
} from '@smart-invoice/graphql';
import { fetchToken, getInvoiceDetails } from '@smart-invoice/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { fromHex, Hex } from 'viem';
import { useBalance, useToken } from 'wagmi';

import { useInstantDetails, useIpfsDetails } from '.';

const fetchTokenData = async () => {
  const response = await fetch(
    'https://smart-invoice.infura-ipfs.io/ipfs/QmSqhPHwiJnjsbfmrrENGU1GrggVJ9vijMaZquR9ujUW4C',
  );
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const useInvoiceDetails = ({
  address,
  chainId,
}: {
  address: Hex;
  chainId: number;
}) => {
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
    });

  // fetch invoice details from Ipfs
  // TODO: remove after subgraph is fixed
  const { data: ipfsDetails } = useIpfsDetails({
    cid: _.get(invoiceDetails, 'detailsHash', ''),
  });


  const { data: tokens } = useQuery({
    queryFn: fetchTokenData,
    queryKey: ['tokens']
  })


  const enhancedInvoiceFromIpfs = ipfsDetails
    ? ({
      ...invoice,
      projectName: ipfsDetails?.projectName,
      startDate: ipfsDetails?.startDate,
      endDate: ipfsDetails?.endDate,
      projectAgreement: ipfsDetails?.projectAgreement,
      projectDescription: ipfsDetails?.projectDescription,
      tokenMetaData,
    } as Invoice)
    : { ...invoice, tokenMetadata };

  const enhancedInvoiceDetailsFromIpfs = ipfsDetails
    ? ({
      ...invoiceDetails,
      projectName: ipfsDetails?.projectName,
      startDate: ipfsDetails?.startDate,
      endDate: ipfsDetails?.endDate,
      projectAgreement: ipfsDetails?.projectAgreement,
      projectDescription: ipfsDetails?.projectDescription,
    } as InvoiceDetails)
    : { ...invoice, tokenMetadata };



  return {
    data: enhancedInvoiceFromIpfs,
    invoiceDetails: enhancedInvoiceDetailsFromIpfs,
    isLoading: isLoading || isInvoiceDetailsLoading,
    error,
  };
};

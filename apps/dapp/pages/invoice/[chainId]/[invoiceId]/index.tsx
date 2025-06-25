import { Button, Stack } from '@chakra-ui/react';
import { INVOICE_TYPES } from '@smartinvoicexyz/constants';
import {
  InstantButtonManager,
  InstantPaymentDetails,
  InvoiceButtonManager,
  InvoicePaymentDetails,
} from '@smartinvoicexyz/forms';
import {
  prefetchInvoiceDetails,
  useInvoiceDetails,
} from '@smartinvoicexyz/hooks';
import {
  Container,
  InvoiceMetaDetails,
  InvoiceNotFound,
  Loader,
} from '@smartinvoicexyz/ui';
import {
  chainLabelFromId,
  getChainName,
  parseChainId,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { Hex, isAddress } from 'viem';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

import { useOverlay } from '../../../../contexts/OverlayContext';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { invoiceId: invId, chainId: urlChainId } = context.params as {
    invoiceId: string;
    chainId: string;
  };

  const invoiceId = _.toLower(String(invId)) as Hex;
  const chainId = parseChainId(urlChainId);

  // If chainId is undefined, return 404
  if (!chainId) {
    return {
      notFound: true,
    };
  }

  const chainLabel = chainLabelFromId(chainId);

  // If the chain label doesn't match the URL chain ID, redirect to the correct URL
  if (chainLabel !== urlChainId) {
    return {
      redirect: {
        destination: `/invoice/${chainLabel}/${invoiceId}`,
        permanent: false,
      },
    };
  }

  // Prefetch all invoice details with extra error handling
  let dehydratedState = null;
  try {
    dehydratedState = await prefetchInvoiceDetails(invoiceId, chainId);
  } catch (error) {
    console.error('Server-side prefetch failed:', error);
    // Continue without prefetched data - client will fetch on mount
  }

  return {
    props: {
      dehydratedState,
    },
  };
}

function ViewInvoice() {
  const router = useRouter();
  const { invoiceId: invId, chainId: urlChainId } = router.query;

  const invoiceId = _.toLower(String(invId)) as Hex;
  const invoiceChainId = parseChainId(urlChainId);

  const { invoiceDetails, isLoading } = useInvoiceDetails({
    chainId: invoiceChainId,
    address: invoiceId,
  });

  const { address } = useAccount();
  const chainId = useChainId();

  const { switchChain } = useSwitchChain();

  const overlay = useOverlay();

  if (!isAddress(invoiceId) || (!invoiceDetails === null && !isLoading)) {
    return <InvoiceNotFound />;
  }

  if (!invoiceDetails || isLoading) {
    return (
      <Container overlay gap={10}>
        <Loader size="80" />
        If the invoice does not load,
        <br />
        please refresh the browser.
      </Container>
    );
  }

  const invoiceType = _.get(
    invoiceDetails,
    'invoiceType',
    INVOICE_TYPES.Escrow,
  );

  const isInvalidChainId =
    !!address && !!invoiceChainId && chainId !== invoiceChainId;

  const showNetworkError = isInvalidChainId;

  return (
    <Container overlay>
      <Stack
        spacing="2rem"
        justify="center"
        align="center"
        direction={{ base: 'column', lg: 'row' }}
        w="100%"
        px="1rem"
        py="8rem"
      >
        <InvoiceMetaDetails invoice={invoiceDetails} />

        <Stack maxW="60rem" w="100%" spacing={4}>
          {invoiceType === INVOICE_TYPES.Instant ? (
            <>
              <InstantPaymentDetails invoice={invoiceDetails} />
              <InstantButtonManager invoice={invoiceDetails} {...overlay} />
            </>
          ) : (
            <>
              <InvoicePaymentDetails invoice={invoiceDetails} {...overlay} />
              <InvoiceButtonManager invoice={invoiceDetails} {...overlay} />
            </>
          )}
          {showNetworkError && (
            <Button
              bg="orange.600"
              _hover={{ bg: 'orange.700' }}
              onClick={() => switchChain?.({ chainId: invoiceChainId })}
              gap={2}
              w="100%"
            >
              Click here to switch network to {getChainName(invoiceChainId)}
            </Button>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}

export default ViewInvoice;

import { Button, Stack } from '@chakra-ui/react';
import { INVOICE_TYPES } from '@smartinvoicexyz/constants';
import {
  InstantButtonManager,
  InstantPaymentDetails,
  InvoiceButtonManager,
  InvoicePaymentDetails,
} from '@smartinvoicexyz/forms';
import { useInvoiceDetails } from '@smartinvoicexyz/hooks';
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
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Hex, isAddress } from 'viem';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

import { useOverlay } from '../../../../contexts/OverlayContext';

function ViewInvoice() {
  const router = useRouter();
  const { invoiceId: invId, chainId: urlChainId } = router.query;

  const invoiceId = _.toLower(String(invId)) as Hex;
  const invoiceChainId = parseChainId(urlChainId);

  useEffect(() => {
    if (invoiceId && invoiceChainId) {
      const chainLabel = chainLabelFromId(invoiceChainId);
      if (chainLabel !== urlChainId) {
        router.replace({
          pathname: `/invoice/${chainLabelFromId(invoiceChainId)}/${invoiceId}`,
          query: undefined,
        });
      }
    }
  }, [invoiceId, urlChainId, invoiceChainId, router]);

  const { invoiceDetails, isLoading } = useInvoiceDetails({
    chainId: invoiceChainId,
    address: invoiceId,
  });

  const { isConnected } = useAccount();
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
    isConnected && !!invoiceChainId && chainId !== invoiceChainId;

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

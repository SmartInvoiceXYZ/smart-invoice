import { Stack } from '@chakra-ui/react';
import {
  InvoiceButtonManager,
  InvoicePaymentDetails,
} from '@smart-invoice/forms';
import { useInvoiceDetails } from '@smart-invoice/hooks';
import {
  Container,
  InvoiceMetaDetails,
  InvoiceNotFound,
  Loader,
} from '@smart-invoice/ui';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Hex, isAddress } from 'viem';
import { useChainId } from 'wagmi';

import { useOverlay } from '../../../../contexts/OverlayContext';

function ViewInvoice() {
  const chainId = useChainId();
  const { modals, setModals } = useOverlay();
  const router = useRouter();
  const { invoiceId: invId, chainId: hexChainId } = router.query;
  const invoiceId = _.toLower(String(invId)) as Hex;
  const invoiceChainId = hexChainId
    ? parseInt(String(hexChainId), 16)
    : undefined;

  const { invoiceDetails, isLoading } = useInvoiceDetails({
    chainId: invoiceChainId || chainId,
    address: invoiceId,
  });

  if (!isAddress(invoiceId) || (!invoiceDetails === null && !isLoading)) {
    return <InvoiceNotFound />;
  }

  if (invoiceDetails && chainId !== invoiceChainId) {
    return (
      <InvoiceNotFound chainId={invoiceChainId} heading="Incorrect Network" />
    );
  }

  if (!invoiceDetails) {
    return (
      <Container overlay>
        <Loader size="80" />
      </Container>
    );
  }

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

        <Stack minW={{ base: '90%', md: '50%' }}>
          <InvoicePaymentDetails
            invoice={invoiceDetails}
            modals={modals}
            setModals={setModals}
          />
          <InvoiceButtonManager
            invoice={invoiceDetails}
            modals={modals}
            setModals={setModals}
          />
        </Stack>
      </Stack>
    </Container>
  );
}

export default ViewInvoice;

import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { isAddress } from 'viem';

import { Button, Heading, Link, Text, VStack } from '@chakra-ui/react';

import { Loader } from '../../../../components/Loader';
import { ChainId } from '../../../../constants/config';
import { Invoice, fetchInvoice } from '../../../../graphql/fetchInvoice';
import { Container } from '../../../../shared/Container';
import { InvoiceNotFound } from '../../../../shared/InvoiceNotFound';
import { getIpfsLink, getTxLink } from '../../../../utils/helpers';

function LockedInvoice({
  match: {
    params: { hexChainId, invoiceId },
  },
}: any) {
  const [invoice, setInvoice] = useState<Invoice>();
  const router = useRouter();
  const invoiceChainId = parseInt(hexChainId, 16) as ChainId;

  useEffect(() => {
    if (isAddress(invoiceId)) {
      fetchInvoice(invoiceChainId, invoiceId).then(setInvoice);
    }
  }, [invoiceId, invoiceChainId]);

  if (!isAddress(invoiceId) || invoice === null) {
    return <InvoiceNotFound />;
  }

  if (!invoice) {
    return (
      <Container overlay>
        <Loader size="80" />
      </Container>
    );
  }

  const { id, disputes, isLocked } = invoice;

  const dispute =
    isLocked && disputes.length > 0 ? disputes[disputes.length - 1] : undefined;

  if (!dispute) {
    return <InvoiceNotFound heading="Invoice Not Locked" />;
  }

  return (
    <Container overlay>
      <VStack
        w="100%"
        spacing="1rem"
        align="center"
        justify="center"
        my="8rem"
        maxW="35rem"
        px="1rem"
      >
        <Heading fontWeight="normal" textAlign="center">
          Funds Securely Locked
        </Heading>

        <Text color="white" textAlign="center" fontSize="sm" mb="1rem">
          You can view the transaction{' '}
          <Link
            href={getTxLink(invoiceChainId, dispute.txHash)}
            isExternal
            color="red.500"
            textDecoration="underline"
          >
            here
          </Link>
          <br />
          You can view the details on IPFS{' '}
          <Link
            href={getIpfsLink(dispute.ipfsHash)}
            isExternal
            color="red.500"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>

        <Text color="white" fontStyle="italic" textAlign="center" mb="1rem">
          Once a decision is made, the funds will be dispersed according to the
          ruling.
          <br />
          Return to the{' '}
          <Link
            as={NextLink}
            href={`/invoice/${invoiceChainId.toString(16)}/${id}`}
          >
            <u>invoice details page</u>
          </Link>{' '}
          to view the results.
        </Text>

        <Button
          w="100%"
          maxW="30rem"
          variant="outline"
          colorScheme="red"
          textTransform="uppercase"
          fontFamily="mono"
          fontWeight="normal"
          size="lg"
          onClick={() => router.push('/')}
        >
          Return Home
        </Button>
      </VStack>
    </Container>
  );
}

export default LockedInvoice;

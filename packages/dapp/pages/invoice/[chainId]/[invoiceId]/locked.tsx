import { Button, Heading, Stack, Text } from '@chakra-ui/react';
import { useInvoiceDetails } from '@smartinvoicexyz/hooks';
import {
  ChakraNextLink,
  Container,
  InvoiceNotFound,
  Loader,
} from '@smartinvoicexyz/ui';
import { getIpfsLink, getTxLink } from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { Hex, isAddress } from 'viem';

function LockedInvoice() {
  const router = useRouter();
  const { invoiceId: invId, chainId: hexChainId } = router.query;

  const invoiceId = _.toLower(String(invId)) as Hex;
  const invoiceChainId = hexChainId
    ? parseInt(String(hexChainId), 16)
    : undefined;

  const { invoiceDetails, isLoading } = useInvoiceDetails({
    address: invoiceId,
    chainId: invoiceChainId,
  });

  if (!isAddress(invoiceId) || (!invoiceDetails === null && !isLoading)) {
    return <InvoiceNotFound />;
  }

  if (!invoiceDetails || isLoading) {
    return (
      <Container overlay>
        <Loader size="80" />
        If the invoice does not load,
        <br />
        please refresh the browser.
      </Container>
    );
  }

  const { id, dispute } = _.pick(invoiceDetails, ['id', 'dispute']);

  if (!dispute) {
    return <InvoiceNotFound heading="Invoice Not Locked" />;
  }

  return (
    <Container overlay>
      <Stack
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
          <ChakraNextLink
            href={getTxLink(invoiceChainId, dispute.txHash)}
            isExternal
            color="red.500"
            textDecoration="underline"
          >
            here
          </ChakraNextLink>
          <br />
          You can view the details on IPFS{' '}
          <ChakraNextLink
            href={getIpfsLink(dispute.ipfsHash)}
            isExternal
            color="red.500"
            textDecoration="underline"
          >
            here
          </ChakraNextLink>
        </Text>

        <Text color="white" fontStyle="italic" textAlign="center" mb="1rem">
          Once a decision is made, the funds will be dispersed according to the
          ruling.
          <br />
          Return to the{' '}
          <ChakraNextLink href={`/invoice/${invoiceChainId}/${id}`}>
            <u>invoice details page</u>
          </ChakraNextLink>{' '}
          to view the results.
        </Text>

        <ChakraNextLink href="/">
          <Button
            w="100%"
            maxW="30rem"
            variant="outline"
            colorScheme="red"
            textTransform="uppercase"
            fontFamily="mono"
            fontWeight="normal"
            size="lg"
          >
            Return Home
          </Button>
        </ChakraNextLink>
      </Stack>
    </Container>
  );
}

export default LockedInvoice;

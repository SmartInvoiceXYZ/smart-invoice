import { Button, Heading, Stack, Text } from '@chakra-ui/react';
import { useInvoiceDetails } from '@smartinvoicexyz/hooks';
import {
  ChakraNextLink,
  Container,
  InvoiceNotFound,
  Loader,
} from '@smartinvoicexyz/ui';
import {
  chainIdFromLabel,
  chainLabelFromId,
  getIpfsLink,
  getTxLink,
} from '@smartinvoicexyz/utils';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Hex, isAddress } from 'viem';

export const parseChainId = (chainIdOrLabel: string | string[] | undefined) => {
  if (!chainIdOrLabel) return undefined;
  // eslint-disable-next-line no-param-reassign
  chainIdOrLabel = chainIdOrLabel.toString();
  if (chainIdOrLabel.startsWith('0x')) return parseInt(chainIdOrLabel, 16);
  if (Number.isInteger(Number(chainIdOrLabel))) return Number(chainIdOrLabel);
  const chainId = chainIdFromLabel(chainIdOrLabel.toLowerCase());
  if (chainId) return chainId;
  // eslint-disable-next-line no-param-reassign
  chainIdOrLabel = `0x${chainIdOrLabel}`;
  return parseInt(chainIdOrLabel, 16);
};

function LockedInvoice() {
  const router = useRouter();
  const { invoiceId: invId, chainId: urlChainId } = router.query;

  const invoiceId = _.toLower(String(invId)) as Hex;
  const invoiceChainId = parseChainId(urlChainId);

  useEffect(() => {
    if (invoiceId && invoiceChainId) {
      router.replace({
        pathname: `/invoice/${chainLabelFromId(invoiceChainId)}/${invoiceId}`,
        query: undefined,
      });
    }
  }, [invoiceId, invoiceChainId, router]);

  if (!invoiceChainId) {
    return <InvoiceNotFound heading="Invalid Chain Id" />;
  }

  const invoiceChainLabel = chainLabelFromId(invoiceChainId);

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

  const { dispute } = _.pick(invoiceDetails, ['dispute']);

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
          <ChakraNextLink href={`/invoice/${invoiceChainLabel}/${invoiceId}`}>
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

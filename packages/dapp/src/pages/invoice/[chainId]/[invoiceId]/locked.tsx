// @ts-expect-error TS(2792): Cannot find module 'ethers'. Did you mean to set t... Remove this comment to see the full error message
import { utils } from 'ethers';
// @ts-expect-error TS(2792): Cannot find module 'next/link'. Did you mean to se... Remove this comment to see the full error message
import NextLink from 'next/link';
// @ts-expect-error TS(2792): Cannot find module 'next/router'. Did you mean to ... Remove this comment to see the full error message
import { useRouter } from 'next/router';
// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import React, { useEffect, useState } from 'react';

// @ts-expect-error TS(2792): Cannot find module '@chakra-ui/react'. Did you mea... Remove this comment to see the full error message
import { Button, Heading, Link, Text, VStack } from '@chakra-ui/react';

// @ts-expect-error TS(6142): Module '../../../../components/Loader' was resolve... Remove this comment to see the full error message
import { Loader } from '../../../../components/Loader';
import { getInvoice } from '../../../../graphql/getInvoice';
// @ts-expect-error TS(6142): Module '../../../../shared/Container' was resolved... Remove this comment to see the full error message
import { Container } from '../../../../shared/Container';
// @ts-expect-error TS(6142): Module '../../../../shared/InvoiceNotFound' was re... Remove this comment to see the full error message
import { InvoiceNotFound } from '../../../../shared/InvoiceNotFound';
import {
  getHexChainId,
  getIpfsLink,
  getTxLink,
} from '../../../../utils/helpers';

function LockedInvoice({
  match: {
    params: { hexChainId, invoiceId },
  }
}: any) {
  const [invoice, setInvoice] = useState();
  const router = useRouter();
  const invoiceChainId = parseInt(hexChainId, 16);

  useEffect(() => {
    if (utils.isAddress(invoiceId)) {
      getInvoice(invoiceChainId, invoiceId).then(i => setInvoice(i));
    }
  }, [invoiceId, invoiceChainId]);

  if (!utils.isAddress(invoiceId) || invoice === null) {
    
    return <InvoiceNotFound />;
  }

  if (!invoice) {
    return (
      
      <Container overlay>
        
        <Loader size="80" />
      </Container>
    );
  }

  const { id, network, disputes, isLocked } = invoice;

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
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
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
          // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
          <br />
          Return to the{' '}
          
          <Link as={NextLink} to={`/invoice/${getHexChainId(network)}/${id}`}>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
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

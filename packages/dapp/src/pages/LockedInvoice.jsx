import { Button, Heading, Link, Text, VStack } from '@chakra-ui/react';
import { utils } from 'ethers';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink, Redirect, useHistory } from 'react-router-dom';

import { Loader } from '../components/Loader';
import { getInvoice } from '../graphql/getInvoice';
import { Container } from '../shared/Container';
import { getIpfsLink, getTxLink } from '../utils/helpers';

export const LockedInvoice = ({
  match: {
    params: { invoiceId },
  },
}) => {
  const [invoice, setInvoice] = useState();
  const history = useHistory();

  useEffect(() => {
    if (utils.isAddress(invoiceId)) {
      getInvoice(invoiceId).then(i => setInvoice(i));
    }
  }, [invoiceId]);

  if (!utils.isAddress(invoiceId) || invoice === null) {
    return <Redirect to="/" />;
  }

  if (!invoice) {
    return (
      <Container overlay>
        <Loader size="80" />
      </Container>
    );
  }

  const { disputes, isLocked } = invoice;

  const dispute =
    isLocked && disputes.length > 0 ? disputes[disputes.length - 1] : undefined;

  if (!dispute) {
    return <Redirect to="/" />;
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
      >
        <Heading fontWeight="normal" textAlign="center">
          Funds Securely Locked
        </Heading>
        <Text color="white" textAlign="center" fontSize="sm" mb="1rem">
          You can view the transaction{' '}
          <Link
            href={getTxLink(dispute.txHash)}
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
          <RouterLink to={`/invoice/${invoiceId}`}>
            <u>invoice details page</u>
          </RouterLink>{' '}
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
          onClick={() => history.push('/')}
        >
          Return Home
        </Button>
      </VStack>
    </Container>
  );
};

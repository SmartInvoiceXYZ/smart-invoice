import { Button, useBreakpointValue, VStack } from '@chakra-ui/react';
import React, { useContext, useState, useEffect } from 'react';

import { Web3Context } from '../context/Web3Context';
import { logError } from '../utils/helpers';

import { Spinner, Text } from '@chakra-ui/react';

import { verify } from '../utils/invoice';

export const VerifyInvoice = ({
  invoice,
  verified,
  client,
  setVerifiedStatus,
}) => {
  const { provider } = useContext(Web3Context);
  const { address } = invoice;
  const [transaction, setTransaction] = useState();

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    let status = invoice.verified[0];
    if (status && status.client === client) {
      setVerifiedStatus(true);
    }
  }, [verified, client, setVerifiedStatus, invoice.verified]);

  const verifyInvoice = async () => {
    try {
      let tx;
      tx = await verify(provider, address);
      setTransaction(tx);
      await tx.wait();
      provider.once(tx.hash, transaction => {
        if (transaction) setVerifiedStatus(true);
      });
    } catch (verifyError) {
      logError({ verifyError });
    }
  };

  return (
    <VStack w="100%" spacing="rem">
      {transaction ? (
        <Button
          size={buttonSize}
          colorScheme="blue"
          variant="outline"
          fontWeight="normal"
          fontFamily="mono"
          textTransform="uppercase"
        >
          <Text>verifying...</Text>
          <Spinner />
        </Button>
      ) : (
        <Button
          size={buttonSize}
          colorScheme="blue"
          variant="outline"
          fontWeight="normal"
          fontFamily="mono"
          textTransform="uppercase"
          onClick={() => verifyInvoice()}
        >
          <Text>Enable Non-Client Account Deposits</Text>
        </Button>
      )}
    </VStack>
  );
};

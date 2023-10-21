import { Button, Spinner, Text,VStack  } from '@chakra-ui/react';
import React, { useContext, useEffect,useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { logError } from '../utils/helpers';
import { verify } from '../utils/invoice';

export function VerifyInvoice({
  invoice,
  verified,
  client,
  isClient,
  verifiedStatus,
  setVerifiedStatus,
}) {
  const { provider } = useContext(Web3Context);
  const { address } = invoice;
  const [transaction, setTransaction] = useState();

  useEffect(() => {
    const status = invoice.verified[0];
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
    <VStack w="100%" spacing="rem" alignItems="start">
      {verifiedStatus ? null : isClient ? (
        transaction ? (
          <Button
            size="xs"
            colorScheme="blue"
            variant="outline"
            fontWeight="bold"
            fontFamily="mono"
            textTransform="uppercase"
          >
            <Text>verifying...</Text>
            <Spinner ml="1" size="sm" />
          </Button>
        ) : (
          <Button
            size="xs"
            colorScheme="blue"
            fontWeight="normal"
            fontFamily="mono"
            textTransform="uppercase"
            onClick={() => verifyInvoice()}
          >
            <Text>Enable Non-Client Account Deposits</Text>
          </Button>
        )
      ) : null}
    </VStack>
  );
}

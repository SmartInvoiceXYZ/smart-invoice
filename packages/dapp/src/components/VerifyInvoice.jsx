import { Button, useBreakpointValue, VStack } from '@chakra-ui/react';
import React, { useContext, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { logError } from '../utils/helpers';

import { verify } from '../utils/invoice';

export const VerifyInvoice = ({ invoice }) => {
  const { provider } = useContext(Web3Context);
  const { address } = invoice;
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState();
  const [verified, setVerified] = useState(false);

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  const verifyInvoice = async () => {
    try {
      setLoading(true);
      let tx;
      tx = await verify(provider, address);
      setTransaction(tx);
      await tx.wait();
      setLoading(false);
    } catch (verifyError) {
      setLoading(false);
      logError({ verifyError });
    }
  };

  return (
    <VStack w="100%" spacing="rem">
      <Button
        size={buttonSize}
        colorScheme="red"
        fontWeight="normal"
        fontFamily="mono"
        textTransform="uppercase"
        onClick={() => verifyInvoice()}
      >
        Verify Account to Enable Deposits
      </Button>
    </VStack>
  );
};

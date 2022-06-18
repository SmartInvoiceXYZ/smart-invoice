import { Button, useBreakpointValue, VStack } from '@chakra-ui/react';
import React, { useContext, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { logError } from '../utils/helpers';

import { Spinner, Text } from '@chakra-ui/react';

import { verify } from '../utils/invoice';

export const VerifyInvoice = ({ invoice }) => {
  const { provider } = useContext(Web3Context);
  const { address } = invoice;
  const [transaction, setTransaction] = useState();

  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  const verifyInvoice = async () => {
    try {
      let tx;
      tx = await verify(provider, address);
      setTransaction(tx);
      await tx.wait();
    } catch (verifyError) {
      logError({ verifyError });
    }
  };

  return (
    <VStack w="100%" spacing="rem">
      <Button
        size={buttonSize}
        colorScheme="red"
        variant="outline"
        fontWeight="normal"
        fontFamily="mono"
        textTransform="uppercase"
        onClick={() => verifyInvoice()}
      >
        {transaction ? (
          <Spinner />
        ) : (
          <Text>Enable Non-Client Account Deposits</Text>
        )}
      </Button>
    </VStack>
  );
};

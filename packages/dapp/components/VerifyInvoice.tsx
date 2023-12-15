import React, { useEffect, useState } from 'react';
import { Hash } from 'viem';
import { useWalletClient } from 'wagmi';

/* eslint-disable no-nested-ternary */
import { Button, Spinner, Text, VStack } from '@chakra-ui/react';
import { waitForTransaction } from '@wagmi/core';

import { logError } from '../utils/helpers';
import { verify } from '../utils/invoice';

export function VerifyInvoice({
  invoice,
  verified,
  client,
  isClient,
  verifiedStatus,
  setVerifiedStatus,
}: any) {
  const { data: walletClient } = useWalletClient();
  const { address } = invoice;
  const [txHash, setTxHash] = useState<Hash>();

  useEffect(() => {
    const status = invoice.verified[0];
    if (status && status.client === client) {
      setVerifiedStatus(true);
    }
  }, [verified, client, setVerifiedStatus, invoice.verified]);

  const verifyInvoice = async () => {
    try {
      if (!walletClient) {
        logError('verifyInvoice: walletClient is null');
        return;
      }
      const hash = await verify(walletClient, address);
      setTxHash(hash);
      const chainId = walletClient.chain.id;
      const txReceipt = await waitForTransaction({ chainId, hash });
      if (txReceipt.status === 'success') setVerifiedStatus(true);
    } catch (verifyError) {
      logError({ verifyError });
    }
  };

  return (
    <VStack w="100%" spacing="rem" alignItems="start">
      {verifiedStatus ? null : isClient ? (
        txHash ? (
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

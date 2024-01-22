import { Button, Spinner, Text, VStack } from '@chakra-ui/react';
import { Invoice } from '@smart-invoice/graphql';
import { useInvoiceVerify } from '@smart-invoice/hooks';
import { logError } from '@smart-invoice/utils';
import React, { useEffect, useState } from 'react';
import { Hash, isAddress } from 'viem';
import { useChainId, useWalletClient } from 'wagmi';
import { waitForTransaction } from 'wagmi/actions';

import { useToast } from '../hooks';

type VerifyInvoiceProps = {
  invoice: Invoice;
  verifiedStatus: boolean;
  isClient: boolean;
};

export function VerifyInvoice({
  invoice,
  verifiedStatus,
  isClient,
}: VerifyInvoiceProps) {
  const chainId = useChainId();
  const toast = useToast();
  const { address } = invoice || {};
  const [txHash, setTxHash] = useState<Hash>();

  const validAddress = address && isAddress(address) ? address : undefined;

  const { writeAsync } = useInvoiceVerify({
    address: validAddress,
    chainId,
    toast,
  });

  // const verifyInvoice = async () => {
  //   try {
  //     if (!walletClient || !validAddress) {
  //       logError('verifyInvoice: walletClient is null');
  //       return;
  //     }
  //     const hash = '0x'; // await verify(walletClient, validAddress);
  //     setTxHash(hash);
  //     const chainId = walletClient.chain.id;
  //     const txReceipt = await waitForTransaction({ chainId, hash });
  //     if (txReceipt.status === 'success') setVerifiedStatus(true);
  //   } catch (verifyError) {
  //     logError({ verifyError });
  //   }
  // };

  if (verifiedStatus || !isClient) return null;

  return (
    <VStack w="100%" spacing="rem" alignItems="start">
      {txHash ? (
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
          onClick={() => writeAsync?.()}
        >
          <Text>Enable Non-Client Account Deposits</Text>
        </Button>
      )}
    </VStack>
  );
}

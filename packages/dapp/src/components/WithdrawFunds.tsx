import React, { useEffect, useState } from 'react';
import { Address, Hash, formatUnits } from 'viem';
import { useWalletClient } from 'wagmi';

import {
  Button,
  Heading,
  Link,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react';

import { getTokenInfo, getTxLink, isAddress, logError } from '../utils/helpers';
import { withdraw } from '../utils/invoice';
import { waitForTransaction } from '../utils/transactions';
import { Invoice } from '../graphql/fetchInvoice';
import { ChainId } from '../constants/config';
import { TokenData } from '../types';

type WithdrawFundsProps = {
  invoice: Invoice;
  balance: bigint;
  close: () => void;
  tokenData: Record<ChainId, Record<Address, TokenData>>;
};

export function WithdrawFunds({
  invoice,
  balance,
  close,
  tokenData,
}: WithdrawFundsProps) {
  const [loading, setLoading] = useState(false);
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
  const { network, address, token } = invoice ?? {};
  const validAddress = isAddress(address);

  const { decimals, symbol } = getTokenInfo(chainId, token, tokenData);
  const [txHash, setTxHash] = useState<Hash>();
  const buttonSize = useBreakpointValue({ base: 'md', md: 'lg' });

  useEffect(() => {
    const send = async () => {
      try {
        if (balance <= 0 || !walletClient || !validAddress) return;
        setLoading(true);
        const hash = await withdraw(walletClient, validAddress);
        setTxHash(hash);
        const { chain } = walletClient;
        await waitForTransaction(chain, hash);
        window.location.href = `/invoice/${chain.id.toString(
          16,
        )}/${validAddress}`;
        setLoading(false);
      } catch (withdrawError) {
        close();
        logError({ withdrawError });
      }
    };

    if (!loading) {
      send();
    }
  }, [network, balance, address, walletClient, loading, close, validAddress]);

  return (
    <VStack w="100%" spacing="1rem">
      <Heading
        fontWeight="normal"
        mb="1rem"
        textTransform="uppercase"
        textAlign="center"
      >
        Withdraw Funds
      </Heading>

      <Text textAlign="center" fontSize="sm" mb="1rem">
        Follow the instructions in your wallet to withdraw remaining funds from
        the escrow.
      </Text>

      <VStack my="2rem" px="5rem" py="1rem" bg="black" borderRadius="0.5rem">
        <Text color="red.500" fontSize="0.875rem" textAlign="center">
          Amount To Be Withdrawn
        </Text>

        <Text
          color="white"
          fontSize="1rem"
          fontWeight="bold"
          textAlign="center"
        >{`${formatUnits(balance, decimals)} ${symbol}`}</Text>
      </VStack>
      {chainId && txHash && (
        <Text color="white" textAlign="center" fontSize="sm">
          Follow your transaction{' '}
          <Link
            href={getTxLink(chainId, txHash)}
            isExternal
            color="red.500"
            textDecoration="underline"
          >
            here
          </Link>
        </Text>
      )}

      <Button
        onClick={close}
        variant="outline"
        colorScheme="red"
        textTransform="uppercase"
        size={buttonSize}
        fontFamily="mono"
        fontWeight="normal"
        w="100%"
      >
        Close
      </Button>
    </VStack>
  );
}

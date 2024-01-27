import { Button, Stack, Text } from '@chakra-ui/react';
import { Invoice } from '@smart-invoice/graphql';
import { useInvoiceVerify } from '@smart-invoice/hooks';
import { isAddress, TransactionReceipt } from 'viem';
import { useChainId } from 'wagmi';

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

  const validAddress = address && isAddress(address) ? address : undefined;

  const onTxSuccess = (tx: TransactionReceipt) => {
    console.log('tx', tx);
    // TODO handle tx success
    // parse logs
    // wait for subgraph
    // invalidate query
  };

  const { writeAsync, isLoading } = useInvoiceVerify({
    address: validAddress,
    chainId,
    toast,
    onTxSuccess,
  });

  if (verifiedStatus || !isClient) return null;

  return (
    <Stack w="100%" spacing="rem" alignItems="start">
      <Button
        size="xs"
        colorScheme="blue"
        fontWeight="normal"
        fontFamily="mono"
        textTransform="uppercase"
        isLoading={isLoading}
        isDisabled={!writeAsync}
        onClick={() => writeAsync?.()}
      >
        <Text>Enable Non-Client Account Deposits</Text>
      </Button>
    </Stack>
  );
}

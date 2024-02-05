import { Button, Stack, Text } from '@chakra-ui/react';
import { InvoiceDetails } from '@smart-invoice/graphql';
import { useVerify } from '@smart-invoice/hooks';
import { isAddress } from 'viem';
import { useChainId } from 'wagmi';

import { useToast } from '../hooks';

type VerifyInvoiceProps = {
  invoice: InvoiceDetails;
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

  const onTxSuccess = () => {
    console.log('tx');
    // TODO handle tx success
    // parse logs
    // wait for subgraph
    // invalidate query
  };

  const { writeAsync, isLoading } = useVerify({
    address: validAddress,
    chainId,
    toast,
    onTxSuccess,
  });

  const handleVerify = () => {
    writeAsync?.();
  };

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
        onClick={handleVerify}
      >
        <Text>Enable Non-Client Account Deposits</Text>
      </Button>
    </Stack>
  );
}

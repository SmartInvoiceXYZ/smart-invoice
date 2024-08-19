import { Button, Stack, Text } from '@chakra-ui/react';
import { TOASTS } from '@smartinvoicexyz/constants/src';
import { InvoiceDetails } from '@smartinvoicexyz/graphql';
import { useVerify } from '@smartinvoicexyz/hooks';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const validAddress = address && isAddress(address) ? address : undefined;

  const onTxSuccess = () => {
    toast.success(TOASTS.useVerify.success);
    // invalidate cache
    queryClient.invalidateQueries({
      queryKey: ['invoiceDetails'],
    });
    queryClient.invalidateQueries({ queryKey: ['extendedInvoiceDetails'] });
  };

  const { writeAsync, isLoading } = useVerify({
    invoice,
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

import { Button, Stack, Text } from '@chakra-ui/react';
import { TOASTS } from '@smartinvoicexyz/constants';
import { QUERY_KEY_INVOICE_DETAILS, useVerify } from '@smartinvoicexyz/hooks';
import { InvoiceDetails } from '@smartinvoicexyz/types';
import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { isAddress } from 'viem';
import { useAccount, useChainId } from 'wagmi';

import { useToast } from '../hooks';

type VerifyInvoiceProps = {
  invoice: Partial<InvoiceDetails>;
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
  const { address: account } = useAccount();
  const isConnected = !!account;
  const {
    address,
    chainId: invoiceChainId,
    dispute,
    resolution,
  } = _.pick(invoice, ['address', 'chainId', 'dispute', 'resolution']);
  const queryClient = useQueryClient();
  const validAddress = address && isAddress(address) ? address : undefined;

  const onTxSuccess = () => {
    toast.success(TOASTS.useVerify.success);
    // invalidate cache
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY_INVOICE_DETAILS],
    });
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

  const isInvalidChain = chainId !== invoiceChainId;
  const isDisputed = (!!dispute || !!resolution) ?? false;

  if (
    verifiedStatus ||
    !isClient ||
    !isConnected ||
    isInvalidChain ||
    isDisputed
  )
    return null;

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

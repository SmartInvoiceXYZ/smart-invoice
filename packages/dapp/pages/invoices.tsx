import { Box } from '@chakra-ui/react';
import { InvoiceDashboardTable } from '@smart-invoice/ui';
import React from 'react';
import { useAccount, useChainId } from 'wagmi';

function Invoices() {
  const { address } = useAccount();
  const chainId = useChainId();

  return (
    <Box paddingY={16} flex="1 0 100%">
      <InvoiceDashboardTable chainId={chainId} searchInput={address} />
    </Box>
  );
}

export default Invoices;

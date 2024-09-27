import { InvoiceDashboardTable } from '@smartinvoicexyz/ui';
import React from 'react';
import { useAccount, useChainId } from 'wagmi';

function Invoices() {
  const { address } = useAccount();
  const chainId = useChainId();

  return <InvoiceDashboardTable chainId={chainId} searchInput={address} />;
}

export default Invoices;

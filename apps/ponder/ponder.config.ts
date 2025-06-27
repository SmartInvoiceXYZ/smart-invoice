import { createConfig } from 'ponder';

import { SmartInvoiceFactory01Abi } from './abis/SmartInvoiceFactory01Abi';

export default createConfig({
  chains: {
    sepolia: { id: 11155111, rpc: process.env.PONDER_RPC_URL_11155111! },
  },
  contracts: {
    SmartInvoiceFactory01: {
      chain: 'sepolia',
      address: '0x8227b9868e00B8eE951F17B480D369b84Cd17c20',
      abi: SmartInvoiceFactory01Abi,
      startBlock: 7243433,
    },
  },
});

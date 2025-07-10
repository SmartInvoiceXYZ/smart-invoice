import { viem } from 'hardhat';

// Replace the constant value with the actual ESCROW_ADDRESS you are targeting
const ESCROW_ADDRESS = '0x293E057Fdff9396f4F6d081Af5D531C1a0Bc6B1B';

async function main(): Promise<void> {
  // Retrieve the updatable escrow contract instance using `viem`
  const escrow = await viem.getContractAt(
    'SmartInvoiceEscrow',
    ESCROW_ADDRESS,
  );

  // Fetch the providerReceiver from the contract
  const providerReceiver = await escrow.read.providerReceiver();
  const clientReceiver = await escrow.read.clientReceiver();

  console.log('Provider Receiver:', providerReceiver);
  console.log('Client Receiver:', clientReceiver);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

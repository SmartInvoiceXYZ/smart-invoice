import { viem } from 'hardhat';

// Replace the constant value with the actual ESCROW_ADDRESS you are targeting
const ESCROW_ADDRESS = '0x293E057Fdff9396f4F6d081Af5D531C1a0Bc6B1B';

async function main(): Promise<void> {
  // Retrieve the updatable escrow contract instance using `viem`
  const updatableEscrow = await viem.getContractAt(
    'SmartInvoiceUpdatable',
    ESCROW_ADDRESS,
  );

  // Fetch the providerReceiver from the contract
  const providerReceiver = await updatableEscrow.read.providerReceiver();

  console.log('Provider Receiver:', providerReceiver);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

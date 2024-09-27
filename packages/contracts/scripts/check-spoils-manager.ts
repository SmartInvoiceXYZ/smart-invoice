import { viem } from 'hardhat';
import { Hex } from 'viem';

const SPOILS_MANAGER_ADDRESS = '0x3fA4E6e03Fbd434A577387924aF39efd3b4b50F2';

async function checkSpoilsManagerData(address: Hex): Promise<void> {
  const spoilsManagerInstance = await viem.getContractAt(
    'SpoilsManager',
    address,
  );

  // Fetch the data from the contract
  const owner = await spoilsManagerInstance.read.owner();
  const spoils = await spoilsManagerInstance.read.getSpoils();
  const receiver = await spoilsManagerInstance.read.receiver();

  console.log('owner:', owner, ', spoils:', spoils, ', receiver:', receiver);
}

async function main(): Promise<void> {
  await checkSpoilsManagerData(SPOILS_MANAGER_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

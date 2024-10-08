// import { getWrappedTokenAddress } from './constants'; // Uncomment if needed
import { verifyContract } from './utils/general';

async function main(): Promise<void> {
  await verifyContract(
    100, // chainId,
    '0x0AC3d8D1436910dB7cEfc49b2AE598dc31A88390', // contractAddress,
    ['0xeE4466Fc68fF9a49E4a6b706aF509ed8000b82BF'], // constructorArguments,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

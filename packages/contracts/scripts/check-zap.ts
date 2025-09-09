import { viem } from 'hardhat';

import { getZapData } from './constants';

async function main(): Promise<void> {
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();

  const zapData = getZapData(chainId);
  if (!zapData) {
    console.log('No Zap Data Found');
    return;
  }
  const safeSplitsEscrowZapAddress = zapData.daoZaps?.[0];

  if (!safeSplitsEscrowZapAddress) {
    console.log('No Safe-Splits-Escrow Zap Deployed');
    return;
  }

  const safeSplitsEscrowZap = await viem.getContractAt(
    'SafeSplitsDaoEscrowZap',
    safeSplitsEscrowZapAddress,
  );

  const addressList: Array<keyof typeof safeSplitsEscrowZap.read> = [
    'safeSingleton',
    'fallbackHandler',
    'safeFactory',
    'splitFactory',
    'escrowFactory',
    'dao',
    'daoReceiver',
    'spoilsBPS',
  ];

  // eslint-disable-next-line no-restricted-syntax
  for (const key of addressList) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await (
        safeSplitsEscrowZap.read[key] as () => Promise<unknown>
      )();
      console.log(`${key}: ${result}`);
    } catch (error) {
      console.log(`${key}: Error - ${error}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

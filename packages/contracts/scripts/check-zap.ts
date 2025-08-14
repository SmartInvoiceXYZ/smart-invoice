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
    'splitMain',
    'escrowFactory',
    'dao',
    'daoReceiver',
    'spoilsBPS',
  ];

  const addressFetch = addressList.map(async type =>
    safeSplitsEscrowZap.read[type](),
  );

  const addresses = await Promise.all(addressFetch);
  console.log(
    addresses.map((address, index) => `${addressList[index]}: ${address}`),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

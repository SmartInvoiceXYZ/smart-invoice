import { viem } from 'hardhat';
import { encodeAbiParameters, Hex, toBytes, toHex, zeroAddress } from 'viem';

import { getWrappedTokenAddress, getZapData } from './constants';

const ZAP_DATA = {
  owners: [
    '0x68d36DcBDD7Bbf206e27134F28103abE7cf972df' as Hex,
    '0x9f1A8952a4bdde3eB02f79B537eAFFEB02b3552C' as Hex,
  ],
  client: '0x68d36DcBDD7Bbf206e27134F28103abE7cf972df' as Hex,
  resolver: '0x9f1A8952a4bdde3eB02f79B537eAFFEB02b3552C' as Hex,
  percentAllocations: [50 * 1e4, 50 * 1e4], // raid party split percent allocations, 100% = 1e6
  milestoneAmounts: [
    BigInt(10) * BigInt(10 ** 14),
    BigInt(10) * BigInt(10 ** 14),
  ], // escrow milestone amounts
  threshold: 2n, // threshold
  saltNonce: BigInt(Math.floor(new Date().getTime() / 1000)), // salt nonce
  arbitration: 1n,
  token: getWrappedTokenAddress(5), // token
  escrowDeadline: BigInt(
    Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
  ), // deadline
  details: toHex(toBytes('ipfs://'), { size: 32 }), // details
  fallbackHandler: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4' as Hex,
};

const isDaoSplit = false;
const isTeamSplit = true;

async function main(): Promise<void> {
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();

  const zapData = getZapData(chainId);
  if (!zapData) {
    console.log('No Safe-Splits-Escrow Zap Data');
    return;
  }
  const safeSplitsEscrowZapAddress = zapData.instances?.[0];

  if (!safeSplitsEscrowZapAddress) {
    console.log('No Safe-Splits-Escrow Zap Deployed');
    return;
  }

  const safeSplitsEscrowZap = await viem.getContractAt(
    'SafeSplitsEscrowZap',
    safeSplitsEscrowZapAddress,
  );

  const encodedSafeData = encodeAbiParameters(
    ['uint256', 'uint256'].map(t => ({ type: t })),
    [ZAP_DATA.threshold, ZAP_DATA.saltNonce],
  );

  const encodedEscrowData = encodeAbiParameters(
    [
      'address',
      'uint32',
      'address',
      'address',
      'uint256',
      'uint256',
      'bytes32',
    ].map(t => ({ type: t })),
    [
      ZAP_DATA.client,
      ZAP_DATA.arbitration,
      ZAP_DATA.resolver,
      ZAP_DATA.token,
      ZAP_DATA.escrowDeadline,
      ZAP_DATA.saltNonce,
      ZAP_DATA.details,
    ],
  );

  console.log(
    'Creating safe, split and escrow with',
    ZAP_DATA.owners.length,
    'owners',
  );

  const safeAddress = zeroAddress;
  const splitData = encodeAbiParameters(
    ['bool', 'bool'].map(t => ({ type: t })),
    [isTeamSplit, isDaoSplit],
  );

  const createTxHash = await safeSplitsEscrowZap.write.createSafeSplitEscrow([
    ZAP_DATA.owners,
    ZAP_DATA.percentAllocations,
    ZAP_DATA.milestoneAmounts,
    encodedSafeData,
    safeAddress,
    splitData,
    encodedEscrowData,
  ]);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: createTxHash,
  });

  const split = receipt.logs[2].topics[1];
  const escrow = receipt.logs[5].topics[2];

  console.log('Transaction Hash:', receipt.transactionHash);
  console.log('Safe:', receipt.logs[0].address);
  console.log('Split:', split);
  console.log('Escrow:', escrow);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

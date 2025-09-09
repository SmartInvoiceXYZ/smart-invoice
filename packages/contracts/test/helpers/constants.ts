import { Hex, toBytes, toHex } from 'viem';

// Hardcoded constants for Sepolia testnet (chain ID 11155111)
export const SEPOLIA_CONTRACTS = {
  safeSingleton: '0xEdd160fEBBD92E350D4D398fb636302fccd67C7e' as Hex,
  safeFactory: '0x14F2982D601c9458F93bd70B218933A6f8165e7b' as Hex,
  fallbackHandler: '0x85a8ca358D388530ad0fB95D0cb89Dd44Fc242c3' as Hex,
  pullSplitFactory: '0x6B9118074aB15142d7524E8c4ea8f62A3Bdb98f1' as Hex, // v2 pull split factory
  splitsWarehouse: '0x8fb66F38cF86A3d5e8768f8F1754A24A6c661Fb8' as Hex,
  wrappedETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as Hex,
};

export const ESCROW_TYPE = toHex(toBytes('escrow-v3', { size: 32 }));
export const ARBITRABLE_TYPE = toHex(toBytes('arbitrable-v3', { size: 32 }));
export const MINIMAL_TYPE = toHex(toBytes('minimal-v3', { size: 32 }));

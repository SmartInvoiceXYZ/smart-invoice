import { Hex } from 'viem';

export type InvoiceType = 'escrow-v3' | 'split-escrow';

export type SpoilsManager = {
  factory?: Hex;
  implementations?: Hex[];
};

export type Zap = {
  dao?: Hex;
  safeSingleton?: Hex;
  fallbackHandler?: Hex;
  safeFactory?: Hex;
  splitMain?: Hex;
  spoilsManager?: Hex;
  factory?: Hex;
  implementations?: Hex[];
  instances?: Hex[];
};

export type NonDao = {
  factory?: Hex;
  implementations?: Hex[];
  instances?: Hex[];
};

export type DeploymentInfo = {
  network: string;
  factory: Hex;
  txHash: Hex;
  blockNumber: string;
  implementations?: Partial<Record<InvoiceType, Hex[]>>;
  spoilsManager?: SpoilsManager;
  zap?: Zap;
  'non-dao'?: NonDao;
};

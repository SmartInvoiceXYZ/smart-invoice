import { Hex } from 'viem';

export interface Invoice {
  address: Hex;
  // onchain
  client: Hex;
  provider: Hex;
  providerReceiver?: Hex;
  token: Hex;
  isLocked: boolean;
  disputes: any[]; // Dispute[];
  resolutions: any[]; // Resolution[];
  deposits: any[]; // Deposit[];
  releases: any[]; // Release[];
  terminationTime: number;
  currentMilestone: number;
  amounts: number[];
  released: number;
  total: number;
  resolver: Hex;
  resolutionRate: number;
  // form
  safetyValveDate?: Date; // converts to terminationTime
  milestones?: number[]; // convert to amounts & total
  // split zap
  raidPartySplit?: boolean;
  daoSplit?: boolean;
}

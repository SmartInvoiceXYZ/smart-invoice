import { Address, Hash } from 'viem';

import { Network } from './network';

export type DisputeDetails = {
  id: string;
  invoice: Address;
  ipfsHash: Hash;
  txHash: Hash;
  timestamp: number;
  amount: bigint;
  reason: string;
  status: string;
  resolver: Address;
  disputeTx: Hash;
  resolutionTx: Hash;
};

export type InvoiceTx = {
  id: string;
  invoice: Address;
  amount: bigint;
  timestamp: number;
  txHash: Hash;
};

export type ResolutionDetails = {
  id: string;
  invoice: Address;
  ipfsHash: string;
  txHash: Hash;
  timestamp: number;
  amount: bigint;
  reason: string;
  status: string;
  resolver: Address;
  disputeTx: Hash;
  resolutionTx: Hash;
  clientAward: bigint;
  providerAward: bigint;
  resolutionFee: bigint;
};

export type ProjectAgreementDocument = {
  src: string;
  type: string;
  createdAt: string;
};

export type Invoice = {
  id: string;
  createdAt: number;
  address: Address;
  network: Network;
  invoiceType: 'escrow' | 'instant';
  token: Address;
  projectName: string;
  projectDescription: string;
  projectAgreement: ProjectAgreementDocument[];
  startDate: number;
  endDate: number;
  terminationTime: number;
  client: Address;
  provider: Address;
  resolver: Address;
  currentMilestone: number;
  amounts: bigint[];
  total: bigint;
  released: bigint;
  isLocked: boolean;
  deposits: InvoiceTx[];
  releases: InvoiceTx[];
  disputes: DisputeDetails[];
  resolutions: ResolutionDetails[];
  resolutionRate: number;
  verified: boolean;
};

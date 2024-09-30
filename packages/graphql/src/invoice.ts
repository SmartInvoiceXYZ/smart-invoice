/* eslint-disable camelcase */
import { logDebug } from '@smartinvoicexyz/shared';
import { Address, Hex, isAddress } from 'viem';

import { fetchTypedQuery } from './client';
import {
  _SubgraphErrorPolicy_,
  ADR,
  Deposit_orderBy,
  Dispute_orderBy,
  OrderDirection,
  Release_orderBy,
  Resolution_orderBy,
  Verified_orderBy,
} from './zeus';

export type TokenMetadata = {
  address: Hex;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
};

export type TokenBalance = {
  decimals: number;
  symbol: string;
  value: bigint;
};

export type InstantDetails = {
  totalDue?: bigint;
  amountFulfilled?: bigint;
  fulfilled?: boolean;
  deadline?: bigint;
  lateFee?: bigint;
  lateFeeTimeInterval?: bigint;
};

export type Release = {
  id: string;
  txHash: string;
  milestone: bigint;
  amount: bigint;
  timestamp: bigint;
};

export type Deposit = {
  id: string;
  txHash: string;
  sender: string;
  amount: bigint;
  timestamp: bigint;
};

export type Dispute = {
  sender: string;
  details: string;
  id: string;
  txHash: string;
  timestamp: bigint;
  ipfsHash: string;
  disputeToken?: string | undefined;
  disputeFee?: bigint | undefined;
  disputeId?: bigint | undefined;
};

export type Resolution = {
  id: string;
  txHash: string;
  ipfsHash: string;
  resolverType: ADR;
  resolver: string;
  clientAward: bigint;
  providerAward: bigint;
  resolutionDetails?: string | undefined;
  resolutionFee?: bigint | undefined;
  timestamp: bigint;
};

export type Invoice = {
  amounts: bigint[];
  version?: bigint | undefined;
  address: string;
  invoiceType?: string | undefined;
  resolver: string;
  resolutionRate: bigint;
  ipfsHash: string;
  token: string;
  id: string;
  createdAt: bigint;
  network: string;
  client: string;
  provider: string;
  resolverType: ADR;
  isLocked: boolean;
  currentMilestone: bigint;
  total: bigint;
  released: bigint;
  terminationTime: bigint;
  deposits: Deposit[];
  releases: Release[];
  disputes: Dispute[];
  resolutions: Resolution[];
  verified: {
    id: string;
    client: string;
  }[];
};

export const fetchInvoice = async (
  chainId: number,
  queryAddress: Address,
): Promise<Invoice | null> => {
  const address = isAddress(queryAddress) && queryAddress;
  if (!address) return null;

  const data = await fetchTypedQuery(chainId)({
    invoice: [
      {
        id: address,
        subgraphError: _SubgraphErrorPolicy_.allow,
      },
      {
        id: true,
        address: true,
        token: true,
        amounts: true,
        client: true,
        createdAt: true,
        currentMilestone: true,
        deposits: [
          {
            // first: 10,
            orderBy: Deposit_orderBy.timestamp,
            orderDirection: OrderDirection.desc,
          },
          {
            id: true,
            txHash: true,
            sender: true,
            amount: true,
            timestamp: true,
          },
        ],
        ipfsHash: true,
        disputes: [
          {
            orderBy: Dispute_orderBy.timestamp,
            orderDirection: OrderDirection.desc,
          },
          {
            id: true,
            details: true,
            disputeFee: true,
            disputeId: true,
            disputeToken: true,
            ipfsHash: true,
            sender: true,
            timestamp: true,
            txHash: true,
          },
        ],
        invoiceType: true,
        isLocked: true,
        network: true,
        provider: true,
        releases: [
          {
            orderBy: Release_orderBy.timestamp,
            orderDirection: OrderDirection.desc,
          },
          {
            id: true,
            amount: true,
            milestone: true,
            timestamp: true,
            txHash: true,
          },
        ],
        released: true,
        resolutionRate: true,
        resolutions: [
          {
            orderBy: Resolution_orderBy.timestamp,
            orderDirection: OrderDirection.desc,
          },
          {
            id: true,
            clientAward: true,
            ipfsHash: true,
            providerAward: true,
            resolutionDetails: true,
            resolutionFee: true,
            resolver: true,
            resolverType: true,
            timestamp: true,
            txHash: true,
          },
        ],
        resolver: true,
        resolverType: true,
        terminationTime: true,
        total: true,
        verified: [
          {
            orderBy: Verified_orderBy.client,
            orderDirection: OrderDirection.asc,
          },
          {
            id: true,
            client: true,
          },
        ],
        version: true,
      },
    ],
  });

  logDebug({ invoice: data?.invoice, address });

  if (!data?.invoice) return null;

  return data.invoice as unknown as Invoice;
};

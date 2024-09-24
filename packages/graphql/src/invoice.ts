/* eslint-disable camelcase */
import { Resolver } from '@smartinvoicexyz/constants';
import { logDebug } from '@smartinvoicexyz/shared';
import { Address, Hex, isAddress } from 'viem';

import { fetchTypedQuery } from './client';
import {
  _SubgraphErrorPolicy_,
  ADR,
  Agreement_orderBy,
  Deposit_orderBy,
  Dispute_orderBy,
  OrderDirection,
  Release_orderBy,
  Resolution_orderBy,
  Verified_orderBy,
} from './zeus';

export const fetchInvoice = async (chainId: number, queryAddress: Address) => {
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
        details: true,
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
        endDate: true,
        invoiceType: true,
        isLocked: true,
        network: true,
        projectName: true,
        projectDescription: true,
        projectAgreement: [
          {
            orderBy: Agreement_orderBy.createdAt,
            orderDirection: OrderDirection.desc,
          },
          {
            id: true,
            type: true,
            src: true,
            createdAt: true,
          },
        ],
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
        startDate: true,
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

  logDebug({ data, address });

  if (!data?.invoice) return null;

  const amounts = data.invoice.amounts.map((amount: string) => BigInt(amount));

  return {
    ...data.invoice,
    amounts,
  };
};

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

export interface InstantDetails {
  totalDue?: bigint;
  amountFulfilled?: bigint;
  fulfilled?: boolean;
  deadline?: bigint;
  lateFee?: bigint;
  lateFeeTimeInterval?: bigint;
}

export interface Release {
  id: string;
  txHash: string;
  milestone: bigint;
  amount: bigint;
  timestamp: bigint;
}

export interface Deposit {
  id: string;
  txHash: string;
  sender: string;
  amount: bigint;
  timestamp: bigint;
}

export interface Dispute {
  id: string;
  txHash: string;
  sender: string;
  details: string;
  ipfsHash: string;
  disputeToken: string | undefined;
  disputeFee: bigint | undefined;
  disputeId: bigint | undefined;
  timestamp: bigint;
}

export interface Resolution {
  id: string;
  txHash: string;
  details: string;
  ipfsHash: string;
  resolverType: ADR;
  resolver: string;
  clientAward: bigint;
  providerAward: bigint;
  resolutionDetails: string | undefined;
  resolutionFee: bigint | undefined;
  ruling: bigint | undefined;
  timestamp: bigint;
}

export type Invoice = Awaited<ReturnType<typeof fetchInvoice>>;

export type InvoiceDetails = Invoice &
  InstantDetails & {
    // conversions
    currentMilestoneNumber: number;
    chainId: number | undefined;
    // computed values
    deposited: bigint | undefined;
    due: bigint | undefined;
    total: bigint | undefined;
    currentMilestoneAmount: bigint | undefined;
    parsedAmounts: number[];
    depositedMilestones: boolean[];
    depositedMilestonesDisplay: (string | undefined)[];
    depositedTxs: (Deposit | undefined)[];
    releasedTxs: (Release | undefined)[];
    detailsHash: string | undefined;
    resolverName: string | undefined;
    resolverInfo: Record<Address, Resolver> | undefined; // ResolverInfo;
    resolverFee: string | undefined;
    resolverFeeDisplay: string | undefined;
    klerosCourt?: number | string | undefined;
    deadlineLabel: string | undefined;
    // entities
    dispute?: Dispute | undefined;
    resolution?: Resolution | undefined;
    // flags
    isExpired: boolean;
    isReleasable: boolean;
    isLockable: boolean;
    isWithdrawable: boolean;
    // token data
    tokenMetadata: TokenMetadata | undefined;
    tokenBalance: TokenBalance | undefined;
    nativeBalance: TokenBalance | undefined;
  };

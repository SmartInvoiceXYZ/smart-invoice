import { Resolver } from '@smartinvoicexyz/constants';
import {
  Deposit,
  Dispute,
  InstantDetails,
  Invoice,
  Release,
  Resolution,
  TokenBalance,
  TokenMetadata,
} from '@smartinvoicexyz/graphql';

import { InvoiceMetadata } from './metadata';

export type FormInvoice = {
  title: string;
  description: string;
  document: string;
  milestones: {
    value: string;
    title?: string | undefined;
    description?: string | undefined;
  }[];
  startDate: string;
  endDate: string;
  resolverType: string;
  resolverAddress?: string;
  isResolverTermsChecked?: boolean;
  klerosCourt?: number;
  safetyValveDate?: Date;
  deadline?: Date;
  token: string;
  client: string;
  clientReceiver?: string;
  provider: string;
  providerReceiver?: string;
  // instant details
  paymentDue?: string;
  lateFee?: string;
  lateFeeTimeInterval?: string;
};

export type InvoiceDetails = Partial<
  Omit<Invoice, 'projectName' | 'projectDescription' | 'projectAgreement'> &
    InstantDetails & {
      // conversions
      currentMilestoneNumber: number;
      currentMilestoneAmount: bigint | undefined;
      chainId: number | undefined;
      // computed values
      deposited: bigint | undefined;
      due: bigint | undefined;
      total: bigint | undefined;
      parsedAmounts: number[];
      depositedMilestones: boolean[];
      depositedMilestonesDisplay: (string | undefined)[];
      depositedTxs: (Deposit | undefined)[];
      releasedTxs: (Release | undefined)[];
      detailsHash: string | undefined;
      // resolver
      resolverInfo: Resolver; // ResolverInfo;
      resolverFee: string | undefined;
      resolverFeeDisplay: string | undefined;
      deadlineLabel: string | undefined;
      // disputes
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
      // invoice metadata
      metadata: InvoiceMetadata;
    }
>;

import { Invoice } from '@smart-invoice/graphql';

export interface ProjectAgreement {
  src: string;
  type: string;
}

export type FormInvoice = {
  milestones: { value: string }[];
  customResolver?: string;
  resolverTerms?: boolean;
} & Invoice;

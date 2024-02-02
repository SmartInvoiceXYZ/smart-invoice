import { Invoice } from '@smart-invoice/graphql';

export interface ProjectAgreement {
  id: string;
  src: string;
  type: string;
  createdAt: Date;
}

interface InvoiceDetails {
  projectName: string;
  projectDescription: string;
  projectAgreement: string;
  startDate: number; // seconds since epoch
  endDate: number; // seconds since epoch
  version: string; // to differentiating versions of smart-invoice contract/json structure
}

export type FormInvoice = {
  milestones: { value: string }[];
  customResolver?: string;
  resolverTerms?: boolean;
  safetyValveDate?: Date;
  deadline?: Date;
  token: string;
  client: string;
  provider: string;
  resolver: string;
} & Omit<Invoice, 'projectAgreement'> &
  InvoiceDetails;

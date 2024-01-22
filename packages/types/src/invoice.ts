import { Invoice } from '@smart-invoice/graphql';

export interface ProjectAgreement {
  src: string;
  type: string;
}

interface InvoiceDetails {
  projectName: string;
  projectDescription: string;
  projectAgreement: string;
  startDate: Date;
  endDate: Date;
}

export type FormInvoice = {
  milestones: { value: string }[];
  customResolver?: string;
  resolverTerms?: boolean;
  safetyValveDate?: Date;
  token: string;
  client: string;
  provider: string;
  resolver: string;
} & Omit<Invoice, 'projectAgreement'> &
  InvoiceDetails;

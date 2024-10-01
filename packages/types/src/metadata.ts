import { KnownResolverType } from '@smartinvoicexyz/constants';
import { logDebug } from '@smartinvoicexyz/shared';

export type SupportedURL =
  | `https://${string}`
  | `ipfs://${string}`
  | `ar://${string}`;

export type SupportedURLType = 'https' | 'ipfs' | 'arweave';

export type Document = Partial<{
  id: string;
  src: SupportedURL;
  type: SupportedURLType;
  createdAt: number;
}>;

export type BasicMetadata = Partial<{
  version: string;
  id: string;
  title: string;
  description: string;
  image: Document;
  documents: Document[];
  createdAt: number;
}>;

export type Milestone = Omit<BasicMetadata, 'version'> &
  Partial<{
    endDate: number;
  }>;

export type InvoiceMetadata = BasicMetadata &
  Partial<{
    startDate: number;
    endDate: number;
    resolverType: KnownResolverType;
    klerosCourt: number;
    milestones: Milestone[];
  }>;

export type DeprecatedInvoiceMetadata = Partial<{
  // @deprecated in favor of title
  projectName: string;
  // @deprecated in favor of description
  projectDescription: string;
  // @deprecated in favor of documents
  projectAgreement: Document[];
}>;

export type OldMetadata = InvoiceMetadata & DeprecatedInvoiceMetadata;

const validateTimestamp = (timestamp: unknown): timestamp is number => {
  if (typeof timestamp !== 'number') {
    logDebug('Invalid timestamp: ', timestamp);
    return false;
  }
  return Math.floor(new Date(timestamp * 1000).getTime() / 1000) === timestamp;
};

export const validateDocument = (document: unknown): document is Document => {
  // if (!document || typeof document !== 'object') return false;
  if (!document || typeof document !== 'object') {
    logDebug('Invalid document: ', document);
    return false;
  }

  const { id, src, type, createdAt } = document as Document;

  if (typeof id !== 'string') {
    logDebug('Invalid document id: ', id);
    return false;
  }
  if (
    typeof src !== 'string' ||
    (!src.startsWith('https://') &&
      !src.startsWith('ipfs://') &&
      !src.startsWith('ar://'))
  ) {
    logDebug('Invalid document src: ', src);
    return false;
  }
  if (
    typeof type !== 'string' ||
    !['https', 'ipfs', 'arweave'].includes(type)
  ) {
    logDebug('Invalid document type: ', type);
    return false;
  }
  if (!validateTimestamp(createdAt)) {
    logDebug('Invalid document createdAt: ', createdAt);
    return false;
  }

  return true;
};

export const validateBasicMetadata = (
  metadata: unknown,
  hasVersion = true,
): metadata is BasicMetadata => {
  if (!metadata || typeof metadata !== 'object') {
    logDebug('Invalid metadata: ', metadata);
    return false;
  }

  const { version, id, title, description, image, documents, createdAt } =
    metadata as BasicMetadata;

  if (hasVersion && typeof version !== 'string') {
    logDebug('Invalid metadata version: ', version);
    return false;
  }
  if (typeof id !== 'string') {
    logDebug('Invalid metadata id: ', id);
    return false;
  }
  if (typeof title !== 'string') {
    logDebug('Invalid metadata title: ', title);
    return false;
  }
  if (typeof description !== 'string') {
    logDebug('Invalid metadata description: ', description);
    return false;
  }
  if (!!image && typeof image !== 'object' && !validateDocument(image)) {
    logDebug('Invalid metadata image: ', image);
    return false;
  }
  if (!!documents && !Array.isArray(documents)) {
    logDebug('Invalid metadata documents: ', documents);
    return false;
  }
  if (!validateTimestamp(createdAt)) {
    logDebug('Invalid metadata createdAt: ', createdAt);
    return false;
  }

  if (!!documents && !documents.every(validateDocument)) {
    logDebug('Invalid metadata documents: ', documents);
    return false;
  }

  return true;
};

export const validateMilestone = (
  milestone: unknown,
): milestone is Milestone => {
  if (!milestone || typeof milestone !== 'object') {
    logDebug('Invalid milestone: ', milestone);
    return false;
  }

  if (!validateBasicMetadata(milestone, false)) {
    logDebug('Invalid milestone basic metadata: ', milestone);
    return false;
  }

  const { endDate } = milestone as Milestone;

  if (!!endDate && !validateTimestamp(endDate)) {
    logDebug('Invalid milestone endDate: ', endDate);
    return false;
  }

  return true;
};

export const validateInvoiceMetadata = (
  metadata: unknown,
): metadata is InvoiceMetadata => {
  if (!metadata || typeof metadata !== 'object') {
    logDebug('Invalid metadata: ', metadata);
    return false;
  }

  if (!validateBasicMetadata(metadata)) {
    logDebug('Invalid basic metadata: ', metadata);
    return false;
  }

  const { startDate, endDate, klerosCourt, milestones, resolverType } =
    metadata as InvoiceMetadata;

  if (!validateTimestamp(startDate)) {
    logDebug('Invalid metadata startDate: ', startDate);
    return false;
  }

  if (!validateTimestamp(endDate)) {
    logDebug('Invalid metadata endDate: ', endDate);
    return false;
  }

  if (resolverType === 'kleros' && typeof klerosCourt !== 'number') {
    logDebug('Invalid metadata klerosCourt: ', klerosCourt);
    return false;
  }

  if (!Array.isArray(milestones)) {
    logDebug('Invalid metadata milestones: ', milestones);
    return false;
  }

  if (!milestones.every(validateMilestone)) {
    logDebug('Invalid metadata milestones: ', milestones);
    return false;
  }

  return true;
};

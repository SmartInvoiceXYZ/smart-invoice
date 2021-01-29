import Base58 from 'base-58';
import IPFSClient from 'ipfs-http-client';

import { INVOICE_VERSION } from './constants';

const ipfs = new IPFSClient({
  host: 'ipfs.infura.io',
  port: '5001',
  protocol: 'https',
});

// type Metadata = {
//   projectName: string;
//   projectDescription: string;
//   projectAgreement: string;
//   startDate: number; // seconds since epoch
//   endDate: number; // seconds since epoch
// }

export const uploadMetadata = async meta => {
  const metadata = { ...meta, version: INVOICE_VERSION };
  const objectString = JSON.stringify(metadata);
  const bufferedString = Buffer.from(objectString);
  const node = await ipfs.add(bufferedString);
  const bytes = Buffer.from(Base58.decode(node.path));
  return `0x${bytes.slice(2).toString('hex')}`;
};

export const uploadDisputeDetails = async meta => {
  const metadata = { ...meta, version: INVOICE_VERSION };
  const objectString = JSON.stringify(metadata);
  const bufferedString = Buffer.from(objectString);
  const node = await ipfs.add(bufferedString);
  const bytes = Buffer.from(Base58.decode(node.path));
  return `0x${bytes.slice(2).toString('hex')}`;
};

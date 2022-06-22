import Base58 from 'base-58';
import IPFSClient from 'ipfs-http-client';

import { INVOICE_VERSION } from './constants';

const ipfsTheGraph = new IPFSClient({
  protocol: 'https',
  host: 'api.thegraph.com',
  port: 443,
  'api-path': '/ipfs/api/v0/',
});

const ipfsInfura = new IPFSClient({
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
//   version: string; // to differentiating versions of smart-invoice contract/json structure
// }

export const uploadMetadata = async meta => {
  const metadata = { ...meta, version: INVOICE_VERSION };
  const objectString = JSON.stringify(metadata);
  const bufferedString = Buffer.from(objectString);
  const [node] = await Promise.all([
    ipfsTheGraph.add(bufferedString),
    ipfsInfura.add(bufferedString), // automatically pinned
  ]);
  const { hash } = node[0];

  await ipfsTheGraph.pin.add(hash);
  const bytes = Buffer.from(Base58.decode(hash));
  return `0x${bytes.slice(2).toString('hex')}`;
};

export const uploadDisputeDetails = async meta => {
  const metadata = { ...meta, version: INVOICE_VERSION };
  const objectString = JSON.stringify(metadata);
  const bufferedString = Buffer.from(objectString);
  const [node] = await Promise.all([
    ipfsTheGraph.add(bufferedString),
    ipfsInfura.add(bufferedString), // automatically pinned
  ]);
  const { hash } = node[0];
  await ipfsTheGraph.pin.add(hash);
  const bytes = Buffer.from(Base58.decode(hash));
  return `0x${bytes.slice(2).toString('hex')}`;
};

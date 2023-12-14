import Base58 from 'base-58';
import { create } from 'ipfs-http-client';

import { INFURA_AUTH, INVOICE_VERSION } from '../constants';

// const ipfsTheGraph = create({
//   protocol: 'https',
//   host: 'api.thegraph.com',
//   port: 443,
//   'api-path': '/ipfs/api/v0/',
// });

const ipfsInfura = create({
  host: 'ipfs.infura.io',
  port: '5001',
  protocol: 'https',
  headers: {
    authorization: INFURA_AUTH,
  },
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
  console.log(bufferedString);
  const result = await ipfsInfura.add(bufferedString); // automatically pinned
  console.log(result);

  // infura uses `path` in return result
  const hash = result.path;
  // the graph was failing with CORS error, need to handle failover
  await ipfsInfura.pin.add(hash);
  const bytes = Buffer.from(Base58.decode(hash));
  return `0x${bytes.slice(2).toString('hex')}`;
};

export const uploadDisputeDetails = async meta => {
  const metadata = { ...meta, version: INVOICE_VERSION };
  const objectString = JSON.stringify(metadata);
  const bufferedString = Buffer.from(objectString);
  const result = await ipfsInfura.add(bufferedString); // automatically pinned

  // infura uses `path` in return result
  const hash = result.path;
  // the graph was failing with CORS error, need to handle failover
  await ipfsInfura.pin.add(hash);
  const bytes = Buffer.from(Base58.decode(hash));
  return `0x${bytes.slice(2).toString('hex')}`;
};
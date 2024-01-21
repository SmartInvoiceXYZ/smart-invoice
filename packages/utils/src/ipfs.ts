import { INVOICE_VERSION } from '@smart-invoice/constants';
import axios from 'axios';
import { decode, encode } from 'bs58';
import _ from 'lodash';
import { Hex } from 'viem';

import { logDebug } from './helpers';

// TODO migrate to pinata/web3storage

// type Metadata = {
//   projectName: string;
//   projectDescription: string;
//   projectAgreement: string;
//   startDate: number; // seconds since epoch
//   endDate: number; // seconds since epoch
//   version: string; // to differentiating versions of smart-invoice contract/json structure
// }

// export const uploadMetadata = async (meta: any) => {
//   const metadata = { ...meta, version: INVOICE_VERSION };
//   const objectString = JSON.stringify(metadata);
//   const bufferedString = Buffer.from(objectString);
//   logDebug(bufferedString);
//   const result = await ipfsInfura.add(bufferedString); // automatically pinned
//   logDebug(result);

//   // infura uses `path` in return result
//   const hash = result.path;
//   // the graph was failing with CORS error, need to handle failover
//   await ipfsInfura.pin.add(hash);
//   // const bytes = Buffer.from(Base58.decode(hash));
//   // return `0x${bytes.slice(2).toString('hex')}` as Hash;
// };

// export const uploadDisputeDetails = async (meta: any) => {
//   const metadata = { ...meta, version: INVOICE_VERSION };
//   const objectString = JSON.stringify(metadata);
//   const bufferedString = Buffer.from(objectString);
//   const result = await ipfsInfura.add(bufferedString); // automatically pinned

//   // infura uses `path` in return result
//   const hash = result.path;
//   // the graph was failing with CORS error, need to handle failover
//   await ipfsInfura.pin.add(hash);
//   // const bytes = Buffer.from(Base58.decode(hash));
//   // return `0x${bytes.slice(2).toString('hex')}` as Hash;
// };

export const pinJson = async (
  data: object,
  metadata: object,
  token: string,
) => {
  const pinataData = JSON.stringify({
    pinataOptions: {
      cidVersion: 0,
    },
    pinataMetadata: {
      ...metadata,
    },
    pinataContent: {
      ...data,
    },
  });

  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // TODO can we replace axios and still pass auth?
  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    pinataData,
    config,
  );

  return _.get(res, 'data.IpfsHash');
};

interface handleDetailsPinProps {
  details: object;
  name?: string;
  token: string;
}

export const handleDetailsPin = async ({
  details,
  name,
  token,
}: handleDetailsPinProps) => {
  const cid = await pinJson(details, { name }, token);

  return cid;
};

export const fetchToken = async (count: number = 0) => {
  const token = await fetch('/api/upload-start', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ count }),
  }).then(res => res.text());

  return token;
};

/**
 * Converts IPFS CID version 0 (Base58) to a 32 bytes hex string and adds initial 0x.
 * @param cid - The 46 character long IPFS CID V0 string (starts with Qm).
 * @returns string
 */
export function convertIpfsCidV0ToByte32(cid: string): Hex {
  return `0x${Buffer.from(decode(cid).slice(2)).toString('hex')}`;
}

/**
 * Converts 32 byte hex string (initial 0x is removed) to Base58 IPFS content identifier version 0 address string (starts with Qm)
 * @param str - The 32 byte long hex string to encode to IPFS CID V0 (without initial 0x).
 * @returns string
 */
export function convertByte32ToIpfsCidV0(str: Hex) {
  let newStr: string = str;
  if (str.indexOf('0x') === 0) {
    newStr = str.slice(2);
  }
  return encode(Buffer.from(`1220${newStr}`, 'hex'));
}

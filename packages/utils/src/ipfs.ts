import { logDebug } from '@smartinvoicexyz/shared';
import { KeyRestrictions } from '@smartinvoicexyz/types';
import { decode, encode } from 'bs58';
import _ from 'lodash';
import { Hex } from 'viem';

const { PINATA_JWT } = process.env;

const pinJson = async (data: object, metadata: object, token: string) => {
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

  try {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      method: 'POST',
      body: pinataData,
    });

    const json = await res.json();

    return _.get(json, 'IpfsHash');
  } catch (e) {
    logDebug({ pinataData, token });
    console.error("Couldn't pin data to pinata: ", e);
    return null;
  }
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
}: handleDetailsPinProps) => pinJson(details, { name }, token);

export const fetchToken = async (count: number = 0) => {
  const token = await fetch('/api/upload-start', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ count }),
  })
    .then(res => res.text())
    .catch(e => {
      console.error("Couldn't fetch token", e);
      return null;
    });

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

export const generateApiKey = async (keyRestrictions: KeyRestrictions) => {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(keyRestrictions),
  };

  return fetch('https://api.pinata.cloud/users/generateApiKey', options)
    .then(response => response.json())
    .then(json => {
      if (!_.includes(_.keys(json), 'JWT')) throw new Error('No JWT found');

      const { JWT } = json;
      return JWT;
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.log(error);
      return null;
    });
};

export const keyRestrictions = () => {
  const date = new Date();
  return {
    keyName: `Signed Upload JWT-${date.toISOString()}`,
    maxUses: 2,
    permissions: {
      endpoints: {
        data: {
          pinList: false,
          userPinnedDataTotal: false,
        },
        pinning: {
          pinFileToIPFS: true, // image
          pinJSONToIPFS: true, // json
          pinJobs: false,
          unpin: true, // image (both?)
          userPinPolicy: false,
        },
      },
    },
  };
};

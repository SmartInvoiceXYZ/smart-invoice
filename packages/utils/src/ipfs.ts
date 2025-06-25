import { logDebug } from '@smartinvoicexyz/shared';
import { KeyRestrictions, OldMetadata } from '@smartinvoicexyz/types';
import bs58 from 'bs58';
import _ from 'lodash';
import { Cache } from 'memory-cache';
import { Hex } from 'viem';

const { PINATA_JWT } = process.env;

const IPFS_ENDPOINTS = [
  `https://ipfs.io/ipfs/`,
  `https://cloudflare-ipfs.com/ipfs/`,
  `https://dweb.link/ipfs/`,
  `https://w3s.link/ipfs/`,
  `https://flk-ipfs.xyz/ipfs/`,
];

const cache = new Cache();

export const fetchFromIPFS = async (
  cid: string | undefined,
  sequential: boolean = false,
): Promise<OldMetadata> => {
  if (!cid) {
    throw new Error('CID is required');
  }

  const cachedResponse = cache.get(cid);
  if (cachedResponse) {
    return cachedResponse;
  }

  if (sequential) {
    // Sequential fetching for server-side to prevent too many concurrent connections
    for (let i = 0; i < IPFS_ENDPOINTS.length; i += 1) {
      const endpoint = IPFS_ENDPOINTS[i];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per endpoint

        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(`${endpoint}${cid}`, {
          signal: controller.signal,
          // Add connection keep-alive headers to reduce connection overhead
          headers: {
            Connection: 'keep-alive',
            'Keep-Alive': 'timeout=5, max=10',
          },
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          // eslint-disable-next-line no-await-in-loop
          const data = await res.json();
          cache.put(cid, data);
          return data;
        }
      } catch {
        // Continue to next endpoint on error
      }
    }

    throw new Error(`Failed to fetch from IPFS for CID: ${cid} (sequential)`);
  }

  // Original concurrent approach for client-side
  const controllers = IPFS_ENDPOINTS.map(() => new AbortController());

  try {
    const response = await Promise.any(
      IPFS_ENDPOINTS.map(async (endpoint, index) => {
        const controller = controllers[index];
        const { signal } = controller;

        const res = await fetch(`${endpoint}${cid}`, { signal });
        if (res.ok) {
          // Abort other requests once a successful one is found
          controllers.forEach((ctrl, i) => {
            if (i !== index) ctrl.abort();
          });
          const data = await res.json();
          cache.put(cid, data);
          return data;
        }
        throw new Error(`Failed to fetch from ${endpoint}`);
      }),
    );

    return response as OldMetadata;
  } catch (error) {
    console.error(`Failed to fetch from IPFS for CID: ${cid}: `, error);
    throw new Error(`Failed to fetch from IPFS for CID: ${cid}`);
  }
};

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
  return `0x${Buffer.from(bs58.decode(cid).slice(2)).toString('hex')}`;
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
  return bs58.encode(Buffer.from(`1220${newStr}`, 'hex'));
}

export const generateApiKey = async (keyRestrictions: KeyRestrictions) => {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT env variable is not set');
  }
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
      console.error(`Failed to generate API key: ${error}`);
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

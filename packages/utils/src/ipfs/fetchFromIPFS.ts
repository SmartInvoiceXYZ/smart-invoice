import { OldMetadata } from '@smartinvoicexyz/types';
import { Cache } from 'memory-cache';

const IPFS_ENDPOINTS = [
  `https://smart-invoice.mypinata.cloud/ipfs/`,
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

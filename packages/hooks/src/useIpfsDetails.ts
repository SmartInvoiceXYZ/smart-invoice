import { useQuery } from '@tanstack/react-query';

const IPFS_ENDPOINTS = [
  `https://ipfs.io/ipfs/`,
  `https://cloudflare-ipfs.com/ipfs/`,
  `https://dweb.link/ipfs/`,
  `https://w3s.link/ipfs/`,
  `https://flk-ipfs.xyz/ipfs/`,
];

const fetchFromIPFS = async (cid: string | undefined) => {
  if (!cid) {
    throw new Error('CID is required');
  }

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
          return res;
        }
        throw new Error(`Failed to fetch from ${endpoint}`);
      }),
    );

    return response;
  } catch (error) {
    console.error(`Failed to fetch from IPFS for CID: ${cid}: `, error);
    throw new Error(`Failed to fetch from IPFS for CID: ${cid}`);
  }
};

export const useIpfsDetails = (cid: string | undefined) => {
  const fetchIpfDetails = async () => {
    const response = await fetchFromIPFS(cid);
    const data = await response.json();
    return data;
  };

  return useQuery({
    queryKey: ['ipfsDetails', cid],
    queryFn: fetchIpfDetails,
    enabled: !!cid,
    staleTime: Infinity,
    refetchInterval: false,
  });
};

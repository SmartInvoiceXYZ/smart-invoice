import { IPFS_ENDPOINT } from '@smartinvoicexyz/constants';
import { useQuery } from '@tanstack/react-query';

export const useIpfsDetails = (cid: string | undefined) => {
  const fetchIpfDetails = async () => {
    const response = await fetch(`${IPFS_ENDPOINT}/${cid}`);
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

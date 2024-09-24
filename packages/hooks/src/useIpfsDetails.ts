import { useQuery } from '@tanstack/react-query';

export const useIpfsDetails = (cid: string) => {
  const fetchIpfDetails = async () => {
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
    const data = await response.json();
    return data;
  };
  return useQuery({
    queryKey: ['ipfsDetails', cid],
    queryFn: fetchIpfDetails,
    enabled: !!cid,
  });
};

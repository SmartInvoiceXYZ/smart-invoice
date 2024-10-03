import { fetchFromIPFS } from '@smartinvoicexyz/utils';
import { useQuery } from '@tanstack/react-query';

export const useIpfsDetails = (cid: string | undefined) => {
  return useQuery({
    queryKey: ['ipfsDetails', cid],
    queryFn: async () => fetchFromIPFS(cid),
    enabled: !!cid,
    staleTime: Infinity,
    refetchInterval: false,
  });
};

import { fetchFromIPFS } from '@smartinvoicexyz/utils';
import { useQuery } from '@tanstack/react-query';

export const createIpfsDetailsQueryKey = (cid: string | undefined) =>
  ['ipfsDetails', cid] as const;

export const useIpfsDetails = (cid: string | undefined) => {
  return useQuery({
    queryKey: createIpfsDetailsQueryKey(cid),
    queryFn: async () => fetchFromIPFS(cid),
    enabled: !!cid,
    staleTime: Infinity,
    refetchInterval: false,
  });
};

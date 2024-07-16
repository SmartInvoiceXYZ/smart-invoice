import { IToken } from '@smart-invoice/types/src';
import { logError } from '@smart-invoice/utils';
import { useQuery } from '@tanstack/react-query';

const fetchTokens = async () => {
  const IPFS_TOKENS = `https://t2crtokens.eth.limo/`;

  const response = await fetch(IPFS_TOKENS);
  const tokenData = await response.json();

  if (tokenData?.tokens) {
    return tokenData.tokens as IToken[];
  }

  logError('fetchTokens error:', tokenData);
  return [] as IToken[];
};

export const useFetchTokens = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
    staleTime: Infinity, // 1000 * 60 * 60 * 24,
  });

  return { data, error, isLoading };
};

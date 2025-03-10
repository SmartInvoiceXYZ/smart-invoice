import { IToken } from '@smartinvoicexyz/types';
import { logError } from '@smartinvoicexyz/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const DEFAULT_TOKENS: IToken[] = [
  {
    chainId: 11155111,
    address: '0xdbae4073478cb2cbaba7206485c63c7291f464de',
    symbol: 'MOCK',
    name: 'MockToken',
    decimals: 18,
    logoURI: 'ipfs://QmaNmAVohHYtCFn8H9Lk393KDyj1rhWLUamGggFXM2eGLT',
  },
  {
    chainId: 17000,
    address: '0x06f85c9a4a36e5690b32e73cfdbf280766efd20b',
    symbol: 'MOCK',
    name: 'MockToken',
    decimals: 18,
    logoURI: 'ipfs://QmaNmAVohHYtCFn8H9Lk393KDyj1rhWLUamGggFXM2eGLT',
  },
  {
    chainId: 11155111,
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoURI: 'ipfs://QmPt2DEXhRSvbbFQep44XXtcKxRscshsijJ47Y1xUQwBZ1',
  },
  {
    chainId: 17000,
    address: '0x94373a4919b3240d86ea41593d5eba789fef3848',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoURI: 'ipfs://QmPt2DEXhRSvbbFQep44XXtcKxRscshsijJ47Y1xUQwBZ1',
  },
];

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

export const useFetchTokens = ({ enabled = true }: { enabled: boolean }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
    staleTime: Infinity,
    refetchInterval: false,
    enabled,
  });

  const allTokens = useMemo(
    () => (data ? [...DEFAULT_TOKENS, ...data] : DEFAULT_TOKENS),
    [data],
  );

  return { data: allTokens, error, isLoading };
};

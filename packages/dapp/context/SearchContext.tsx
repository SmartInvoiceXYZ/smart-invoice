import React, { createContext, useEffect, useMemo, useState } from 'react';
import { useWalletClient } from 'wagmi';

import { search } from '../graphql/search';
import { Network } from '../types';
import { logError } from '../utils';

/* eslint-disable no-unused-vars */
export type InvoiceRow = {
  total: bigint;
  invoiceType: 'instant' | 'escrow' | 'unknown';
  address: string;
  network: Network;
  token: string;
  provider: string;
  recipient: string;
  amount: number;
  currency: string;
  status: string;
  action: string;
  createdAt: number;
  projectName: string;
  isLocked: boolean;
  terminationTime: number;
  currentMilestone: number;
  amounts: string[];
  paid: boolean;
  balance: string;
  tokenBalance: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenName: string;
  tokenAddress: string;
  tokenNetwork: string;
  tokenProvider: string;
  tokenRecipient: string;
  tokenPaid: boolean;
  tokenCurrentMilestone: number;
  tokenAmounts: string[];
};

export type SearchContextType = {
  search?: string;
  setSearch: (query: string) => void;
  fetching: boolean;
  loading: boolean;
  result?: InvoiceRow[];
};

export const SearchContext = createContext<SearchContextType>({
  setSearch: () => {},
  fetching: false,
  loading: false,
});

export const SearchContextProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { data: walletClient } = useWalletClient();
  const chainId = walletClient?.chain?.id;
  const [fetching, setFetching] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<InvoiceRow[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chainId && query) {
      setFetching(true);
      setLoading(true);
      search(chainId, query)
        .then(res => {
          setResult(res);
          setFetching(false);
          setLoading(false);
        })
        .catch(searchError => {
          logError({ searchError });
          setResult(undefined);
          setFetching(false);
          setLoading(false);
        });
    } else {
      setResult(undefined);
    }
  }, [chainId, query]);

  const returnValue = useMemo(
    () => ({
      search: query,
      setSearch: setQuery,
      fetching,
      loading,
      result,
    }),
    [query, fetching, loading, result],
  );

  return (
    <SearchContext.Provider value={returnValue}>
      {children}
    </SearchContext.Provider>
  );
};

import React, { createContext, useContext, useEffect, useState } from 'react';

import { search } from '../graphql/search';
import { logError } from '../utils/helpers';
import { Web3Context } from './Web3Context';

type SearchContextType = {
  search?: string;
  setSearch: (query: string) => void;
  fetching: boolean;
  result?: any;
  loading: boolean;
};

export const SearchContext = createContext<SearchContextType>({
  setSearch: () => {},
  fetching: false,
  loading: false,
});

export function SearchContextProvider({
  children
}: any) {
  const { chainId } = useContext(Web3Context);
  const [fetching, setFetching] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
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

  return (
    
    <SearchContext.Provider
      value={{ search: query, setSearch: setQuery, fetching, result, loading }}
    >
      {children}
    </SearchContext.Provider>
  );
}

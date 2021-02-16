import React, { createContext, useContext, useEffect, useState } from 'react';

import { search } from '../graphql/search';
import { logError } from '../utils/helpers';
import { Web3Context } from './Web3Context';

export const SearchContext = createContext();

export const SearchContextProvider = ({ children }) => {
  const { chainId } = useContext(Web3Context);
  const [fetching, setFetching] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState();

  useEffect(() => {
    if (query) {
      setFetching(true);
      search(chainId, query)
        .then(res => {
          setResult(res);
          setFetching(false);
        })
        .catch(searchError => {
          logError({ searchError });
          setResult();
          setFetching(false);
        });
    } else {
      setResult(undefined);
    }
  }, [chainId, query]);

  return (
    <SearchContext.Provider
      value={{ search: query, setSearch: setQuery, fetching, result }}
    >
      {children}
    </SearchContext.Provider>
  );
};

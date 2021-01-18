import React, { createContext, useEffect, useState } from 'react';

import { search } from '../graphql/search';

export const SearchContext = createContext();

export const SearchContextProvider = ({ children }) => {
  const [fetching, setFetching] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState();

  useEffect(() => {
    if (query) {
      setFetching(true);
      search(query)
        .then(res => {
          setResult(res);
          setFetching(false);
        })
        .catch(searchError => {
          // eslint-disable-next-line no-console
          console.error({ searchError });
          setResult();
          setFetching(false);
        });
    } else {
      setResult(undefined);
    }
  }, [query, setQuery]);

  return (
    <SearchContext.Provider
      value={{ search: query, setSearch: setQuery, fetching, result }}
    >
      {children}
    </SearchContext.Provider>
  );
};

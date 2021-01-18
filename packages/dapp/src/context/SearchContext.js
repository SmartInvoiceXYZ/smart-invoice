import { search } from '../graphql/search';
import React, { createContext, useEffect, useState } from 'react';

export const SearchContext = createContext();

const SearchContextProvider = ({ children }) => {
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

export default SearchContextProvider;

import { useState, useEffect } from 'react';
import { formatTokenData, formatTokens } from '../utils/helpers';
import { IPFS_TOKEN_URL } from '../utils/constants';

export const useFetchTokensViaIPFS = () => {
  const [tokenData, setTokenData] = useState();
  const [allTokens, setAllTokens] = useState([]);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      setIsError(false);
      try {
        const response = fetch(IPFS_TOKEN_URL);
        const fullData = (await response).json();
        const formattedData = formatTokenData(await fullData);

        const formattedTokens = formatTokens(formattedData);

        setAllTokens(formattedTokens);
        setTokenData(formattedData);
      } catch (error) {
        setIsError(true);
      }
    };

    fetchTokens();
  }, []);

  return [{ tokenData, isError, allTokens }];
};

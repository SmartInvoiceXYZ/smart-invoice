import { useState, useEffect } from 'react';
import { formatTokenData, formatTokens } from '../utils/helpers';
import { IPFS_ENDPOINT } from '../utils/constants';

import { getCID } from '../utils/firebase';

export const useFetchTokensViaIPFS = () => {
  const [tokenData, setTokenData] = useState();
  const [allTokens, setAllTokens] = useState([]);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    console.log('useFetchTokens via ipfs');
    const fetchTokens = async () => {
      // debugger;
      const CID = await getCID();
      const IPFS_TOKENS = IPFS_ENDPOINT + `/ipfs/${CID}`;
      setIsError(false);
      console.log('fetchTokens ', IPFS_TOKENS, CID);

      try {
        const response = fetch(IPFS_TOKENS);
        const fullData = (await response).json();
        console.log('fullData ', fullData);
        console.log('response ', response);
        const formattedData = formatTokenData(await fullData);

        const formattedTokens = formatTokens(formattedData);

        setAllTokens(formattedTokens);
        setTokenData(formattedData);
      } catch (error) {
        setIsError(true);
      }
    };

    if (isMounted) fetchTokens();
    return () => {
      isMounted = false;
    };
  }, []);
  return [{ tokenData, isError, allTokens }];
};

import { useState, useEffect } from 'react';
import { formatTokenData, formatTokens } from '../utils/helpers';
import { IPFS_ENDPOINT } from '../utils/constants';
import axios from 'axios';

import { getCID } from '../utils/firebase';

export const useFetchTokensViaIPFS = () => {
  const [tokenData, setTokenData] = useState();
  const [allTokens, setAllTokens] = useState([]);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    //   const fetchTokens = async () => {
    //     const CID = await getCID();
    //     const IPFS_TOKENS = IPFS_ENDPOINT + `/ipfs/${CID}`;
    //     setIsError(false);
    //     try {
    //       console.log(IPFS_TOKENS)
    //       const response = await fetch(IPFS_TOKENS);
    //       console.log( response, 'response')

    //       const fullData = (response).json();
    //       const formattedData = formatTokenData(await fullData);

    //       const formattedTokens = formatTokens(formattedData);

    //       setAllTokens(formattedTokens);
    //       setTokenData(formattedData);
    //     } catch (error) {
    //       setIsError(true);
    //     }
    //   };

    const fetchTokens = async () => {
      const CID = await getCID();
      const IPFS_TOKENS = IPFS_ENDPOINT + `/ipfs/${CID}`;
      setIsError(false);
      try {
        console.log(IPFS_TOKENS);
        const { data } = await axios.get(IPFS_TOKENS);
        console.log(data, 'response');

        const formattedData = formatTokenData(data);

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

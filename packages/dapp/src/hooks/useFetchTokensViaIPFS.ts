import { useEffect, useState } from 'react';
import { Address } from 'viem';

import { IPFS_ENDPOINT } from '../constants';
import { ChainId } from '../constants/config';
import { TokenData } from '../types';
import { getCID } from '../utils/firebase';
import { formatTokenData, formatTokens } from '../utils/helpers';

export const useFetchTokensViaIPFS = () => {
  const [tokenData, setTokenData] = useState(
    {} as Record<ChainId, Record<Address, TokenData>>,
  );
  const [allTokens, setAllTokens] = useState({} as Record<ChainId, Address[]>);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTokens = async () => {
      const CID = await getCID();
      const IPFS_TOKENS = `${IPFS_ENDPOINT}/ipfs/${CID}`;
      setIsError(false);
      try {
        const response = fetch(IPFS_TOKENS);
        const fullData = (await response).json();
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

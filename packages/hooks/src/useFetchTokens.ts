import { IPFS_ENDPOINT } from '@smart-invoice/constants';
import { formatTokenData, formatTokens, getCID } from '@smart-invoice/utils';
import { useQuery } from '@tanstack/react-query';

const fetchTokens = async () => {
  const CID = await getCID();
  const IPFS_TOKENS = `${IPFS_ENDPOINT}/ipfs/${CID}`;

  try {
    const response = await fetch(IPFS_TOKENS);
    const fullData = await response.json();
    const formattedData = formatTokenData(fullData);
    const formattedTokens = formatTokens(formattedData);

    return {
      allTokens: formattedTokens,
      tokenData: formattedData,
    };
  } catch (error) {
    console.log(error);
    return {
      allTokens: [],
      tokenData: [],
    };
  }
};

export const useFetchTokens = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokens'],
    queryFn: fetchTokens,
  });

  return { data, error, isLoading };
};

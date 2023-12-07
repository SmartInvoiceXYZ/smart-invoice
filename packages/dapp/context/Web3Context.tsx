import { ethers } from 'ethers';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useAccount } from 'wagmi';
import Web3 from 'web3';

import { SUPPORTED_NETWORKS } from '../constants';
import { logError } from '../utils/helpers';
import { ChainId } from '../types';

type Web3ContextType = {
  loading: boolean;
  account?: string;
  provider?: ethers.providers.Web3Provider;
  chainId?: ChainId;
  // eslint-disable-next-line no-unused-vars
  connectAccount: (provider: ethers.providers.Web3Provider) => Promise<void>;
  disconnect: () => Promise<void>;
};

type Web3ProviderState = {
  account?: string;
  provider?: ethers.providers.Web3Provider;
  chainId?: ChainId;  
};

export const Web3Context = createContext<Web3ContextType>({
  loading: true,
  connectAccount: async () => {},
  disconnect: async () => {},
});
export const useWeb3 = () => useContext(Web3Context);

const defaultWeb3:Web3ProviderState = {};

export function Web3ContextProvider({
  children
}: any) {
  const { address } = useAccount();

  const [loading, setLoading] = useState(false);
  const [web3Context, setWeb3Context] = useState(defaultWeb3);

  useEffect(() => {
    if (!address && web3Context.account) {
      setWeb3Context(defaultWeb3);
    }
  }, [address, loading, web3Context.account]);

  const setWeb3Provider = async (prov: any) => {
    if (!prov) {
      logError(
        'Error: attempted to set Web3 Provider without a provider. Check Web3ContextProvider.',
      );
    } else {
      const web3Provider = new Web3(prov);
      const gotProvider = new ethers.providers.Web3Provider(
        // @ts-ignore
        web3Provider.currentProvider,
      );
      const gotChainId = Number(prov.chain.id) as ChainId;
      const signer = gotProvider.getSigner();
      const gotAccount = await signer.getAddress();

      setWeb3Context({
        provider: gotProvider,
        chainId: gotChainId,
        account: gotAccount,
      });
    }
  };

  useEffect(() => {
    if (web3Context.chainId && SUPPORTED_NETWORKS.indexOf(web3Context.chainId) === -1) {
      // TODO show error alert that invalid network is connected
      logError(
        `Network with Chain Id: ${
          web3Context.chainId
        } is not one of the supported networks. Supported networks are: ${SUPPORTED_NETWORKS.join(
          ', ',
        )}`,
      );
    }
  }, [web3Context.chainId]);

  const connectAccount = useCallback(async (provider: any) => {
    if (!provider) {
      logError('Attempted to set Web3 Provider without provider object.');
      return;
    }
    try {
      setLoading(true);

      await setWeb3Provider(provider);
    } catch (web3ModalError) {
      logError({ web3ModalError });
      throw web3ModalError;
    } finally {
      setLoading(false);
    }
  }, []);

  const returnValue = useMemo(
    () => ({
      loading,
      account: web3Context.account,
      provider: web3Context.provider,
      chainId: web3Context.chainId,
      connectAccount,
      disconnect: async () => {
        setWeb3Context(defaultWeb3);
      },
    }),
    [
      loading,
      web3Context.account,
      web3Context.provider,
      web3Context.chainId,
      connectAccount,
    ],
  );

  return (
    <Web3Context.Provider value={returnValue}>{children}</Web3Context.Provider>
  );
}

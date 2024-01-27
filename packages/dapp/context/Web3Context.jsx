import { ethers } from 'ethers';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAccount } from 'wagmi';
import Web3 from 'web3';

import { SUPPORTED_NETWORKS } from '../constants';
import { logError } from '../utils/helpers';

export const Web3Context = createContext();
export const useWeb3 = () => useContext(Web3Context);

const defaultWeb3 = {
  account: null,
  provider: null,
  chainId: null,
};

export function Web3ContextProvider({ children }) {
  const { address } = useAccount();

  const [loading, setLoading] = useState(false);
  const [web3Context, setWeb3Context] = useState(defaultWeb3);

  useEffect(() => {
    if (!address && web3Context.account) {
      setWeb3Context(defaultWeb3);
    }
  }, [address, loading, web3Context.account]);

  const setWeb3Provider = async prov => {
    if (!prov) {
      logError(
        'Error: attempted to set Web3 Provider without a provider. Check Web3ContextProvider.',
      );
    } else {
      const web3Provider = new Web3(prov);
      const gotProvider = new ethers.providers.Web3Provider(
        web3Provider.currentProvider,
      );
      const gotChainId = Number(prov.chain.id);
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
    if (SUPPORTED_NETWORKS.indexOf(web3Context.chainId) === -1) {
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

  const connectAccount = useCallback(async provider => {
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
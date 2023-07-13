import { ethers } from 'ethers';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import Web3 from 'web3';
import { useAccount } from 'wagmi';

import { SUPPORTED_NETWORKS } from '../utils/constants';
import { logError } from '../utils/helpers';

export const Web3Context = createContext();
export const useWeb3 = () => useContext(Web3Context);

export const Web3ContextProvider = ({ children }) => {
  const { address } = useAccount();

  const [loading, setLoading] = useState(false);
  const defaultWeb3 = { account: null, provider: null, chainId: null };
  const [web3Context, setWeb3Context] = useState(defaultWeb3);

  useEffect(() => {
    if (!address && web3Context.account) {
      setWeb3Context(defaultWeb3);
    }
  }, [address]);

  const setWeb3Provider = async prov => {
    if (!prov) {
      console.error(
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

  const connectWeb3 = useCallback(async provider => {
    if (!provider) return;
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

  return (
    <Web3Context.Provider
      value={{
        loading,
        account: web3Context.account,
        provider: web3Context.provider,
        chainId: web3Context.chainId,
        connectAccount: connectWeb3,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

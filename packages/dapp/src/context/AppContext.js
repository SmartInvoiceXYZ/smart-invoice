import React, { createContext, useState, useCallback, useEffect } from 'react';

import Web3 from 'web3';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

import { chain_id as SUPPORTED_NETWORK } from '../utils/Constants';

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: process.env.REACT_APP_INFURA_ID,
    },
  },
};

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions,
  theme: {
    background: '#ffffff',
    main: '#FF3864',
  },
});

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState({});
  const { web3, account, ethersProvider, chainId } = provider;
  console.log({ web3, account, ethersProvider, chainId });

  const setWeb3Provider = async (prov, updateAccount = false) => {
    if (prov) {
      const web3Provider = new Web3(prov);
      const ethersProvider = new ethers.providers.Web3Provider(
        web3Provider.currentProvider,
      );

      const providerNetwork = await web3Provider.eth.getChainId();
      if (updateAccount) {
        const gotAccounts = await web3Provider.eth.getAccounts();
        setProvider(_provider => ({
          ..._provider,
          web3: web3Provider,
          ethersProvider,
          chainId: providerNetwork,
          account: gotAccounts[0],
        }));
      } else {
        setProvider(_provider => ({
          ..._provider,
          web3: web3Provider,
          ethersProvider,
          chainId: providerNetwork,
        }));
      }
    }
  };

  useEffect(() => {
    if (chainId !== SUPPORTED_NETWORK) {
      //TODO show error alert that invalid network is connected
    }
  }, [chainId]);

  const connectWeb3 = useCallback(async () => {
    try {
      setLoading(true);
      const modalProvider = await web3Modal.connect();

      await setWeb3Provider(modalProvider, true);

      // Subscribe to accounts change
      modalProvider.on('accountsChanged', accounts => {
        setProvider(_provider => ({
          ..._provider,
          account: accounts[0],
        }));
      });

      // Subscribe to chainId change
      modalProvider.on('chainChanged', () => {
        setWeb3Provider(modalProvider);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log({ web3ModalError: error });
    }
    setLoading(false);
  }, []);

  const disconnect = useCallback(async () => {
    web3Modal.clearCachedProvider();
    setProvider({});
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false;
    }
    if (web3Modal.cachedProvider) {
      setLoading(true);
      connectWeb3().catch(error => {
        // eslint-disable-next-line
        console.error({ web3ModalError: error });
      });
    } else {
      setLoading(false);
    }
  }, [connectWeb3]);

  return (
    <AppContext.Provider
      value={{
        loading,
        address: account,
        provider: ethersProvider,
        web3,
        chainID: chainId,
        connectAccount: connectWeb3,
        disconnect,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;

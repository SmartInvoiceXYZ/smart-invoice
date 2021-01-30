import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from 'ethers';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';

import { theme } from '../theme';
import { INFURA_ID, NETWORK } from '../utils/constants';

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: INFURA_ID,
    },
  },
};

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions,
  theme: {
    background: theme.colors.background,
    main: theme.colors.red[500],
    secondary: theme.colors.white,
    hover: theme.colors.black30,
  },
});

export const Web3Context = createContext();

export const Web3ContextProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState({});
  const { web3, account, ethersProvider, chainId } = provider;

  const setWeb3Provider = async (prov, updateAccount = false) => {
    if (prov) {
      const web3Provider = new Web3(prov);
      const providerNetwork = await web3Provider.eth.getChainId();
      if (updateAccount) {
        const gotAccounts = await web3Provider.eth.getAccounts();
        setProvider(_provider => ({
          ..._provider,
          web3: web3Provider,
          ethersProvider: new ethers.providers.Web3Provider(
            web3Provider.currentProvider,
          ),
          chainId: providerNetwork,
          account: gotAccounts[0],
        }));
      } else {
        setProvider(_provider => ({
          ..._provider,
          web3: web3Provider,
          ethersProvider: new ethers.providers.Web3Provider(
            web3Provider.currentProvider,
          ),
          chainId: providerNetwork,
        }));
      }
    }
  };

  useEffect(() => {
    if (chainId !== NETWORK) {
      // TODO show error alert that invalid network is connected
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
    } catch (web3ModalError) {
      // eslint-disable-next-line no-console
      console.error({ web3ModalError });
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
      connectWeb3().catch(web3ModalError => {
        // eslint-disable-next-line
        console.error({ web3ModalError });
      });
    } else {
      setLoading(false);
    }
  }, [connectWeb3]);

  return (
    <Web3Context.Provider
      value={{
        loading,
        account,
        provider: ethersProvider,
        web3,
        chainId,
        connectAccount: connectWeb3,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

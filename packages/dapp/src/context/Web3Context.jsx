import { SafeAppWeb3Modal as Web3Modal } from '@gnosis.pm/safe-apps-web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from 'ethers';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import Web3 from 'web3';

import { theme } from '../theme';
import { SUPPORTED_NETWORKS } from '../utils/constants';
import { getRpcUrl, logError } from '../utils/helpers';

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: {
        1: getRpcUrl(1),
        4: getRpcUrl(4),
        42: getRpcUrl(42),
        100: getRpcUrl(100),
      },
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
export const useWeb3 = () => useContext(Web3Context);

export const Web3ContextProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
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
    if (SUPPORTED_NETWORKS.indexOf(chainId) === -1) {
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
      logError({ web3ModalError });
      throw web3ModalError;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    web3Modal.clearCachedProvider();
    setProvider({});
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false;
    }
    (async function load() {
      if (web3Modal.cachedProvider || (await web3Modal.canAutoConnect())) {
        connectWeb3();
      }
    })();
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

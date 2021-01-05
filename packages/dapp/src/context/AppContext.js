/* eslint-disable no-unused-vars */
import React, { createContext, useState, useCallback, useEffect } from 'react';

import Web3 from 'web3';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

import { chain_id } from '../utils/Constants';

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

const AppContextProvider = props => {
  const [address, setAddress] = useState('');
  const [provider, setProvider] = useState('');
  const [web3, setWeb3] = useState('');
  const [chainID, setChainID] = useState('');
  // project details value

  const disconnect = useCallback(async () => {
    web3Modal.clearCachedProvider();
    setAddress();
    setProvider();
    setWeb3();
    setChainID();
  }, []);

  const connectAccount = useCallback(async () => {
    try {
      // web3Modal.clearCachedProvider();

      const modalProvider = await web3Modal.connect();
      const web3 = new Web3(modalProvider);
      const provider = new ethers.providers.Web3Provider(web3.currentProvider);

      const accounts = await web3.eth.getAccounts();
      let chainID = await web3.eth.net.getId();

      modalProvider.on('chainChanged', newChainId => {
        setChainID(newChainId);
      });

      modalProvider.on('accountsChanged', _accounts => {
        disconnect();
        window.location.href = '/';
      });

      setAddress(accounts[0]);
      setProvider(provider);
      setWeb3(web3);
      setChainID(chainID);
    } catch (err) {
      console.log(err);
    }
  }, [disconnect]);

  useEffect(() => {
    if (chainID !== chain_id) {
      //TODO show error alert that invalid network is connected
    }
  }, [chainID]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectAccount();
    }
  }, [connectAccount]);

  return (
    <AppContext.Provider
      value={{
        address,
        provider,
        web3,
        chainID,
        connectAccount,
        disconnect,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;

/* eslint-disable no-unused-vars */
import React, { createContext, useState, useCallback, useEffect } from 'react';

import Web3 from 'web3';
import ethers from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

import { uploadMetadata } from '../utils/Ipfs';
import { register } from '../utils/Invoice';
import {
  lex_dao,
  aragon_court,
  dai_token,
  weth_token,
} from '../utils/Constants';
import { BigNumber } from 'ethers';

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
  const [projectName, setProjectName] = useState('Lorem Ipsum');
  const [projectDescription, setProjectDescription] = useState(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  );
  const [projectAgreement, setProjectAgreement] = useState(
    'https://www.lipsum.com/',
  );
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [safetyValveDate, setSafetyValveDate] = useState(new Date());
  // payment details value
  const [clientAddress, setClientAddress] = useState('0x0');
  const [paymentAddress, setPaymentAddress] = useState('0x0');
  const [paymentDue, setPaymentDue] = useState(BigNumber.from(0));
  const [paymentToken, setPaymentToken] = useState('DAI');
  const [milestones, setMilestones] = useState(4);
  const [arbitrationProvider, setArbitrationProvider] = useState(
    'Aragon Court',
  );

  const [payments, setPayments] = useState([]);
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);

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

      modalProvider.on('accountsChanged', accounts => {
        window.location.href = '/';
      });

      setAddress(accounts[0]);
      setProvider(provider);
      setWeb3(web3);
      setChainID(chainID);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectAccount().catch(error => {
        // eslint-disable-next-line
        console.error({ web3ModalError: error });
      });
    }
  }, [connectAccount]);

  const disconnect = useCallback(async () => {
    web3Modal.clearCachedProvider();
    setAddress();
    setProvider();
    setWeb3();
    setChainID();
  }, []);

  const validate = () => {
    // TODO: validate all data here
    // ex check if dates are after now, safetyValveDate > endDate, etc
    const paymentsTotal = payments.reduce((t, a) => {
      return t.add(a);
    }, BigNumber.from(0));
    const isPaymentsValid = paymentsTotal.eq(paymentDue);
    return projectName && isPaymentsValid;
  };

  const createInvoice = async () => {
    setLoading(true);
    setTxHash('');
    if (!validate()) throw new Error('validation error');

    const detailsHash = await uploadMetadata({
      projectName,
      projectDescription,
      projectAgreement,
      startDate: Math.floor(startDate / 1000),
      endDate: Math.floor(endDate / 1000),
    });

    const tx = await register(
      provider,
      clientAddress,
      paymentAddress,
      arbitrationProvider === 'Aragon Court' ? 1 : 0,
      arbitrationProvider === 'Aragon Court' ? aragon_court : lex_dao,
      paymentToken === 'DAI' ? dai_token : weth_token,
      payments,
      Math.floor(safetyValveDate / 1000),
      detailsHash,
    );

    setTxHash(tx.hash);
    setLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        address,
        provider,
        web3,
        chainID,
        projectName,
        projectDescription,
        projectAgreement,
        startDate,
        endDate,
        safetyValveDate,
        clientAddress,
        paymentAddress,
        paymentDue,
        paymentToken,
        milestones,
        arbitrationProvider,
        payments,
        txHash,
        loading,
        // functions
        connectAccount,
        disconnect,
        setProjectName,
        setProjectDescription,
        setProjectAgreement,
        setStartDate,
        setEndDate,
        setSafetyValveDate,
        setClientAddress,
        setPaymentAddress,
        setPaymentDue,
        setPaymentToken,
        setMilestones,
        setArbitrationProvider,
        setPayments,
        createInvoice,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;

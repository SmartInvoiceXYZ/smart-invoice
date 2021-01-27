import React, { useContext } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { Web3Context } from '../context/Web3Context';
import { NETWORK } from '../utils/constants';
import { ConnectWeb3 } from './ConnectWeb3';

export const Layout = ({ children }) => {
  const { chainId } = useContext(Web3Context);
  const isValid = chainId === NETWORK;
  return (
    <>
      <Header /> {isValid ? children : <ConnectWeb3 />} <Footer />
    </>
  );
};

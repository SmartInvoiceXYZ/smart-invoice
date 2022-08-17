import { Flex } from '@chakra-ui/react';
import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';
import { SUPPORTED_NETWORKS } from '../utils/constants';
import { ConnectWeb3 } from './ConnectWeb3';
import { Footer } from './Footer';
import { Header } from './Header';

export const Layout = ({ children }) => {
  const { chainId } = useContext(Web3Context);
  const location = useLocation();
  const isOpenPath =
    location.pathname === '/' || location.pathname === '/contracts';
  const isValid = SUPPORTED_NETWORKS.indexOf(chainId) !== -1 || isOpenPath;
  return (
    <Flex
      position="relative"
      w="100%"
      direction="column"
      justify="center"
      align="center"
      bg="#F5F6F8"
      h="100%"
      minH="100vh"
      overflowX="hidden"
      bgSize="cover"
      color="#323C47"
    >
      <Header /> {isValid ? children : <ConnectWeb3 />} <Footer />
    </Flex>
  );
};

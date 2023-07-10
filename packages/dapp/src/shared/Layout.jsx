import { Flex, Box } from '@chakra-ui/react';
import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';
import { SUPPORTED_NETWORKS } from '../utils/constants';
import { ConnectWeb3 } from './ConnectWeb3';
import { Footer } from './Footer';
import { Header } from './Header';

export const Layout = ({ children }) => {
  const { chainId, account } = useContext(Web3Context);
  const location = useLocation();
  const isOpenPath =
    location.pathname === '/' || location.pathname === '/contracts';
  const isValid =
    (account && SUPPORTED_NETWORKS.indexOf(chainId) !== -1) || isOpenPath;
  return (
    <>
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
        {/* <NavBar /> {isValid ? children : <ConnectWeb3 />} <Footer /> */}
        <Header />
        <Flex
          flexGrow={1}
          position="relative"
          w="100%"
          direction="column"
          justify="center"
          align="center"
          h="100%"
        >
          {isValid ? children : <ConnectWeb3 />}
        </Flex>
        <Footer />
      </Flex>
    </>
  );
};

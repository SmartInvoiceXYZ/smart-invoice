
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { Flex } from '@chakra-ui/react';
import { track } from '@vercel/analytics';
import { Analytics } from '@vercel/analytics/react';

import { SUPPORTED_NETWORKS } from '../constants';
import { ConnectWeb3 } from './ConnectWeb3';
import { Footer } from './Footer';
import { Header } from './Header';
import { useWalletClient } from 'wagmi';

export const Layout : React.FC<React.PropsWithChildren> = ({ children }) => {
  const {data: walletClient} = useWalletClient();
  const chainId = walletClient?.chain?.id;
  const account = walletClient?.account;

  useEffect(() => {
    track('ChainChanged', { chain:chainId ?? null});
  }, [chainId]);

  const router = useRouter();
  const isOpenPath =
    router.pathname === '/' || router.pathname === '/contracts';
  const isValid = (account && chainId && chainId in SUPPORTED_NETWORKS) || isOpenPath;

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

      <Analytics />

      <Footer />
    </Flex>
  );
}

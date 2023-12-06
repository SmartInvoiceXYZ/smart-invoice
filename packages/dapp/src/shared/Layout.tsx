// @ts-expect-error TS(2792): Cannot find module 'next/router'. Did you mean to ... Remove this comment to see the full error message
import { useRouter } from 'next/router';
// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import React, { useContext, useEffect } from 'react';

// @ts-expect-error TS(2792): Cannot find module '@chakra-ui/react'. Did you mea... Remove this comment to see the full error message
import { Flex } from '@chakra-ui/react';
// @ts-expect-error TS(2792): Cannot find module '@vercel/analytics'. Did you me... Remove this comment to see the full error message
import { track } from '@vercel/analytics';
// @ts-expect-error TS(2792): Cannot find module '@vercel/analytics/react'. Did ... Remove this comment to see the full error message
import { Analytics } from '@vercel/analytics/react';

// @ts-expect-error TS(2792): Cannot find module '../constants'. Did you mean to... Remove this comment to see the full error message
import { SUPPORTED_NETWORKS } from '../constants';
// @ts-expect-error TS(6142): Module '../context/Web3Context' was resolved to '/... Remove this comment to see the full error message
import { Web3Context } from '../context/Web3Context';
// @ts-expect-error TS(6142): Module './ConnectWeb3' was resolved to '/Users/moc... Remove this comment to see the full error message
import { ConnectWeb3 } from './ConnectWeb3';
// @ts-expect-error TS(6142): Module './Footer' was resolved to '/Users/moc/dev/... Remove this comment to see the full error message
import { Footer } from './Footer';
// @ts-expect-error TS(6142): Module './Header' was resolved to '/Users/moc/dev/... Remove this comment to see the full error message
import { Header } from './Header';

export function Layout({
  children
}: any) {
  const { chainId, account } = useContext(Web3Context);

  useEffect(() => {
    track('ChainChanged', { chainId });
  }, [chainId]);

  const router = useRouter();
  const isOpenPath =
    router.pathname === '/' || router.pathname === '/contracts';
  const isValid =
    (account && SUPPORTED_NETWORKS.indexOf(chainId) !== -1) || isOpenPath;

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

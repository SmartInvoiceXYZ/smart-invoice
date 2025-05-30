import { Flex } from '@chakra-ui/react';
import { isSupportedChainId } from '@smartinvoicexyz/constants';
import { parseChainId } from '@smartinvoicexyz/utils';
import { track } from '@vercel/analytics';
import { Analytics } from '@vercel/analytics/react';
import { useRouter } from 'next/router';
import { PropsWithChildren, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { Footer } from '../molecules/Footer';
import { Header } from '../molecules/Header';
import { SubgraphHealthAlert } from '../molecules/SubgraphHealthAlert';
import { ConnectWeb3 } from './ConnectWeb3';

export function Layout({ children }: PropsWithChildren) {
  const chainId = useChainId();
  const { address } = useAccount();
  const isConnected = !!address;

  useEffect(() => {
    track('ChainChanged', { chain: chainId ?? null });
  }, [chainId]);

  const {
    pathname,
    query: { chainId: _queryChainId },
  } = useRouter();

  const queryChainId = parseChainId(_queryChainId);

  const isOpenPath =
    pathname === '/' ||
    pathname === '/contracts' ||
    pathname.startsWith('/invoice/');

  const isValidConnection = isConnected && isSupportedChainId(chainId);

  const isValid = isOpenPath || isValidConnection;

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
        <SubgraphHealthAlert chainId={queryChainId ?? chainId} />
        {isValid ? children : <ConnectWeb3 />}
      </Flex>
      <Analytics />
      <Footer />
    </Flex>
  );
}

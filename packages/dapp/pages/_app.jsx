import 'focus-visible/dist/focus-visible';
import '@rainbow-me/rainbowkit/styles.css';

import { ChakraProvider, ColorModeScript, CSSReset } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import React, { useState } from 'react';
import { WagmiConfig } from 'wagmi';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { Web3ContextProvider } from '../context/Web3Context';
import { Layout } from '../shared/Layout';
import { globalStyles, theme } from '../theme';
import { chains, wagmiConfig } from '../utils/web3';

function App({ Component, pageProps }) {
  // this fixes this Wagmi bug. Source: https://github.com/rainbow-me/rainbowkit/issues/686#issuecomment-1295798813
  const [resetDate] = useState(0);

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} key={`rainbowkit-${resetDate}`}>
        <ChakraProvider theme={theme}>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <CSSReset />
          <Global styles={globalStyles} />
          <ErrorBoundary>
            <Web3ContextProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </Web3ContextProvider>
          </ErrorBoundary>
        </ChakraProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;

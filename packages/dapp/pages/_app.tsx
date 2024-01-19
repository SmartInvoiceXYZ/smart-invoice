import 'focus-visible/dist/focus-visible';
import '@rainbow-me/rainbowkit/styles.css';

import React, { useState } from 'react';
import { WagmiConfig } from 'wagmi';

import { CSSReset, ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

import { ErrorBoundary, Layout, globalStyles, theme } from '@smart-invoice/ui';
import { chains, wagmiConfig } from '@smart-invoice/utils';
import { AppProps } from 'next/app';

const App = ({ Component, pageProps }: AppProps) => (
  <WagmiConfig config={wagmiConfig}>
    <RainbowKitProvider chains={chains}>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <CSSReset />
        <Global styles={globalStyles} />
        <ErrorBoundary>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ErrorBoundary>
      </ChakraProvider>
    </RainbowKitProvider>
  </WagmiConfig>
);

export default App;

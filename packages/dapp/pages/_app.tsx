import 'focus-visible/dist/focus-visible';
import '@rainbow-me/rainbowkit/styles.css';

import React from 'react';
import { WagmiConfig } from 'wagmi';

import { CSSReset, ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

import { ErrorBoundary, Layout, globalStyles, theme } from '@smart-invoice/ui';
import { chains, wagmiConfig } from '@smart-invoice/utils';
import { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const App = ({ Component, pageProps }: AppProps) => {
  const queryClient = new QueryClient();

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default App;

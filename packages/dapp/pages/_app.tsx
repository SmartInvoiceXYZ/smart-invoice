/* eslint-disable react/jsx-props-no-spreading */
import 'focus-visible/dist/focus-visible';
import '@rainbow-me/rainbowkit/styles.css';

import { ChakraProvider, ColorModeScript, CSSReset } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import {
  ErrorBoundary,
  globalStyles,
  Layout,
  theme,
} from '@smartinvoicexyz/ui';
import { wagmiConfig } from '@smartinvoicexyz/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProps } from 'next/app';
import React from 'react';
import { WagmiProvider } from 'wagmi';

import { OverlayContextProvider } from '../contexts/OverlayContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // With SSR, we usually want to set some default staleTime
      // above 0 to avoid refetching immediately on the client
      staleTime: 5000,
      refetchInterval: 5000,
    },
  },
});

function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <CSSReset />
            <Global styles={globalStyles} />
            <ErrorBoundary>
              <OverlayContextProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </OverlayContextProvider>
            </ErrorBoundary>
          </ChakraProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

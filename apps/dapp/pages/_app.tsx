/* eslint-disable react/jsx-props-no-spreading */
import 'focus-visible/dist/focus-visible';
import '@rainbow-me/rainbowkit/styles.css';

import { ChakraProvider, ColorModeScript, CSSReset } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import {
  AccountAvatar,
  ErrorBoundary,
  globalStyles,
  Layout,
  theme,
} from '@smartinvoicexyz/ui';
import { wagmiConfig } from '@smartinvoicexyz/utils';
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { hashFn } from '@wagmi/core/query';
import { AppProps } from 'next/app';
import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';

import { OverlayContextProvider } from '../contexts/OverlayContext';

function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            queryKeyHashFn: hashFn,
            staleTime: 300000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={pageProps.dehydratedState}>
          <RainbowKitProvider avatar={AccountAvatar}>
            <ChakraProvider theme={theme}>
              <ColorModeScript
                initialColorMode={theme.config.initialColorMode}
              />
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
        </HydrationBoundary>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

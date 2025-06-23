/* eslint-disable react/jsx-props-no-spreading */
import 'focus-visible/dist/focus-visible';
import '@rainbow-me/rainbowkit/styles.css';

import { ChakraProvider, ColorModeScript, CSSReset } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QUERY_KEY_INVOICE_DETAILS } from '@smartinvoicexyz/hooks';
import {
  AccountAvatar,
  ErrorBoundary,
  globalStyles,
  Layout,
  theme,
} from '@smartinvoicexyz/ui';
import { wagmiConfig } from '@smartinvoicexyz/utils';
import {
  hydrate,
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProps } from 'next/app';
import React, { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';

import { OverlayContextProvider } from '../contexts/OverlayContext';

function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
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

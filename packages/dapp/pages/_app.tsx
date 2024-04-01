/* eslint-disable react/jsx-props-no-spreading */
import 'focus-visible/dist/focus-visible';
import { AppProps } from 'next/app';

import { ChakraProvider, ColorModeScript, CSSReset } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { ErrorBoundary, globalStyles, Layout, theme } from '@smart-invoice/ui';
import { wagmiConfig, createWeb3ModalThing } from '@smart-invoice/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WagmiProvider } from 'wagmi';

import { OverlayContextProvider } from '../contexts/OverlayContext';

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // With SSR, we usually want to set some default staleTime
      // above 0 to avoid refetching immediately on the client
      staleTime: 15 * 60 * 1000, // 15 minutes
    },
  },
});

function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

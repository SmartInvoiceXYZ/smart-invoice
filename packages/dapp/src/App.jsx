import 'focus-visible/dist/focus-visible';
import '@rainbow-me/rainbowkit/dist/index.css';

import { ChakraProvider, ColorModeScript, CSSReset } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import {
  connectorsForWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  injectedWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { gnosis, goerli, mainnet, polygon, polygonMumbai } from 'wagmi/chains';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Web3ContextProvider } from './context/Web3Context';
import { Contracts } from './pages/Contracts';
import { CreateInvoiceEscrow } from './pages/escrow/CreateInvoiceEscrow';
import { LockedInvoice } from './pages/escrow/LockedInvoice';
import { ViewInvoice } from './pages/escrow/ViewInvoice';
import { Home } from './pages/Home';
import { CreateInvoiceInstant } from './pages/instant/CreateInvoiceInstant';
import { ViewInstantInvoice } from './pages/instant/ViewInstantInvoice';
import { Invoices } from './pages/Invoices';
import { SelectInvoiceType } from './pages/SelectInvoiceType';
import { Layout } from './shared/Layout';
import { globalStyles, theme } from './theme';

const APP_NAME = 'Smart Invoice';
const PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_ID;

export function App() {
  // this fixes this Wagmi bug. Source: https://github.com/rainbow-me/rainbowkit/issues/686#issuecomment-1295798813
  const [resetDate] = useState(0);
  const { chains, publicClient } = configureChains(
    [mainnet, polygon, gnosis, goerli, polygonMumbai],
    [
      infuraProvider({ apiKey: process.env.REACT_APP_INFURA_ID }),
      publicProvider(),
    ],
  );
  const options = {
    appName: APP_NAME,
    projectId: PROJECT_ID,
    chains,
  };

  const connectors = connectorsForWallets([
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet({ chains, shimDisconnect: true }),
        rainbowWallet({ chains, projectId: PROJECT_ID }),
        ledgerWallet({ chains, projectId: PROJECT_ID }),
        metaMaskWallet({ chains, projectId: PROJECT_ID }),
        coinbaseWallet({ appName: APP_NAME, chains }),
        walletConnectWallet({ chains, projectId: PROJECT_ID, options }),
      ],
    },
  ]);

  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
  });

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} key={`rainbowkit-${resetDate}`}>
        <ChakraProvider theme={theme}>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <CSSReset />
          <Global styles={globalStyles} />
          <ErrorBoundary>
            <Web3ContextProvider>
              <Router>
                <Layout>
                  <Switch>
                    <Route exact path="/" component={Home} />
                    <Route exact path="/contracts" component={Contracts} />

                    <Route exact path="/create" component={SelectInvoiceType} />
                    <Route
                      exact
                      path="/create/escrow"
                      component={CreateInvoiceEscrow}
                    />
                    <Route
                      exact
                      path="/create/instant"
                      component={CreateInvoiceInstant}
                    />

                    <Route exact path="/invoices" component={Invoices} />
                    <Route
                      exact
                      path="/invoice/:hexChainId/:invoiceId"
                      component={ViewInvoice}
                    />
                    <Route
                      exact
                      path="/invoice/:hexChainId/:invoiceId/locked"
                      component={LockedInvoice}
                    />
                    <Route
                      exact
                      path="/invoice/:hexChainId/:invoiceId/instant"
                      component={ViewInstantInvoice}
                    />
                    <Redirect to="/" />
                  </Switch>
                </Layout>
              </Router>
            </Web3ContextProvider>
          </ErrorBoundary>
        </ChakraProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

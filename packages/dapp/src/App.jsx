import 'focus-visible/dist/focus-visible';

import { ChakraProvider, ColorModeScript, CSSReset } from '@chakra-ui/react';
import { css, Global } from '@emotion/react';
import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

import CalendarRed from './assets/calendar-red.svg';
import Calendar from './assets/calendar.svg';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Web3ContextProvider } from './context/Web3Context';
import { CreateInvoice } from './pages/CreateInvoice';
import { FAQ } from './pages/FAQ';
import { Home } from './pages/Home';
import { Invoices } from './pages/Invoices';
import { ViewInvoice } from './pages/ViewInvoice';
import { LockedInvoice } from './pages/LockedInvoice';
import { Layout } from './shared/Layout';
import { theme } from './theme';

const globalStyles = css`
  /*
    This will hide the focus indicator if the element receives focus via the mouse,
    but it will still show up on keyboard focus.
  */
  .js-focus-visible :focus:not([data-focus-visible-added]) {
    outline: none;
    box-shadow: none;
  }
  *:focus {
    border-color: ${theme.colors.red[500]} !important;
    box-shadow: 0 0 0 1px ${theme.colors.red[500]} !important;
  }
  input[type='date']::-webkit-calendar-picker-indicator {
    color: white;
    opacity: 1;
    display: block;
    background: url(${Calendar}) no-repeat;
    background-size: contain !important;
    width: 14px;
    height: 14px;
    border-width: thin;
    cursor: pointer;
    transition: background 0.25s;
    &:hover {
      color: red;
      background: url(${CalendarRed}) no-repeat;
      background-size: contain;
    }
    &:hover,
    &:focus,
    &:active {
      background-size: contain;
      outline: none;
    }
  }
  select option {
    background: black !important;
    color: white;
  }
`;

export const App = () => {
  return (
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
                <Route exact path="/faq" component={FAQ} />
                <Route exact path="/create-invoice" component={CreateInvoice} />
                <Route exact path="/invoices" component={Invoices} />
                <Route exact path="/invoice/:invoiceId" component={ViewInvoice} />
                <Route
                  exact
                  path="/invoice/:invoiceId/locked"
                  component={LockedInvoice}
                />
                <Redirect to="/" />
              </Switch>
            </Layout>
          </Router>
        </Web3ContextProvider>
      </ErrorBoundary>
    </ChakraProvider>
  );
};

import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import AppContextProvider from './context/AppContext';

import './App.scss';
import './sass/sharedStyles.scss';

import Header from './shared/Header';
import Footer from './shared/Footer';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import CreateInvoice from './pages/CreateInvoice';
import ViewInvoice from './pages/ViewInvoice';
import Invoices from './pages/Invoices';

function App() {
  return (
    <div className="app">
      <div className="main">
        <AppContextProvider>
          <Router>
            <Header />
            <Switch>
              <Route path="/" exact component={Home} />
              <Route path="/faq" exact component={FAQ} />
              <Route path="/create-invoice" exact component={CreateInvoice} />
              <Route path="/invoices" exact component={Invoices} />
              <Route path="/invoice/:invoiceId" exact component={ViewInvoice} />
            </Switch>
            <Footer />
          </Router>
        </AppContextProvider>
      </div>
    </div>
  );
}

export default App;

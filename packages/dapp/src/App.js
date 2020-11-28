import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import AppContextProvider from './context/AppContext';

import './App.scss';
import './sass/sharedStyles.scss';

import Header from './shared/Header';
import Home from './pages/Home';
import CreateInvoice from './pages/CreateInvoice';
import ViewInvoice from './pages/ViewInvoice';
import RegisterSuccess from './pages/RegisterSuccess';

function App() {
  useEffect(() => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li');

    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      links.forEach(link => {
        link.classList.toggle('fade');
      });
    });
  }, []);

  return (
    <div className="app">
      <div className="main">
        <AppContextProvider>
          <Router>
            <Header />
            <Switch>
              <Route path="/" exact component={Home} />
              <Route path="/create-invoice" exact component={CreateInvoice} />
              <Route path="/success" exact component={RegisterSuccess} />
              <Route path="/invoice/:invoiceId" exact component={ViewInvoice} />
            </Switch>
          </Router>
        </AppContextProvider>
      </div>
    </div>
  );
}

export default App;

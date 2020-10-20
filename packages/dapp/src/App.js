import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import AppContextProvider from "./context/AppContext";

import './App.scss';
import './sass/sharedStyles.scss';
import './sass/formStyles.scss';

import Header from './shared/Header'
import Home from './pages/Home'
import CreateInvoice from './pages/CreateInvoice'

function App() {

  useEffect(() => {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");
    const links = document.querySelectorAll(".nav-links li");

    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      links.forEach((link) => {
        link.classList.toggle("fade");
      });
    });
  }, [])

  return (
    <div className="app">
      <div className='main'>
        <AppContextProvider>
          <Router>
            <Header />
            <Switch>
              <Route path='/' exact>
                <Home />
              </Route>
              <Route path='/create-invoice' exact>
                <CreateInvoice />
              </Route>
            </Switch>
          </Router>
        </AppContextProvider>
      </div>
    </div>
  );
}

export default App;

import React, {useContext, useRef} from 'react';
import {Link} from 'react-router-dom';

import Logo from '../assets/raidguild__logo.png';
import LogoText from '../assets/logo.svg';
import {AppContext} from '../context/AppContext';

const {nav_items} = require('../utils/Constants');

const Header = () => {
  const {provider, connectAccount, disconnect} = useContext(AppContext);
  const navLinks = useRef(null);
  const onHamburger = () => {
    navLinks.current.classList.toggle('open');
  };
  return (
    <header>
      <Link to="/">
        <div className="logo-container">
          <img src={Logo} alt="logo" />
          <img src={LogoText} alt="logo-text" />
        </div>
      </Link>

      <nav className="hamburger" onClick={onHamburger}>
        <i className="fas fa-bars fa-3x"></i>
      </nav>
      <ul className="nav-links" ref={navLinks}>
        {nav_items.map((item, index) => {
          return (
            <li key={index}>
              <Link to={item.link}>{item.name}</Link>
            </li>
          );
        })}
        {provider ? (
          <li>
            <span onClick={disconnect}>DISCONNECT</span>
          </li>
        ) : (
          <li>
            <span onClick={connectAccount}>CONNECT</span>
          </li>
        )}
      </ul>
    </header>
  );
};

export default Header;

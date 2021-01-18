import React, { useContext, useRef } from 'react';
import { Link } from 'react-router-dom';

import LogoText from '../assets/logo.svg';
import Logo from '../assets/raidguild__logo.png';
import { Web3Context } from '../context/Web3Context';
import { NAV_ITEMS } from '../utils/constants';

export const Header = () => {
  const { provider, connectAccount, disconnect } = useContext(Web3Context);
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
      {/* eslint-disable-next-line */}
      <nav className="hamburger" onClick={onHamburger}>
        <i className="fas fa-bars fa-3x" />
      </nav>
      <ul className="nav-links" ref={navLinks}>
        {NAV_ITEMS.map(item => {
          return (
            <li key={item.name}>
              <Link to={item.link}>{item.name}</Link>
            </li>
          );
        })}
        {provider ? (
          <li>
            {/* eslint-disable-next-line */}
            <span onClick={disconnect}>DISCONNECT</span>
          </li>
        ) : (
          <li>
            {/* eslint-disable-next-line */}
            <span onClick={connectAccount}>CONNECT</span>
          </li>
        )}
      </ul>
    </header>
  );
};

import React, { useContext } from 'react';

import Logo from '../assets/raidguild__logo.png';
import { AppContext } from '../context/AppContext';

const { nav_items } = require("../utils/Constants");

const Header = () => {
    const { address, disconnect } = useContext(AppContext);
    return (
        <header>
            <div className='logo-container'>
                <img src={Logo} alt='logo' />
                <p>Smart Invoice</p>
            </div>

            <nav className='hamburger'>
                <i className='fas fa-bars fa-3x'></i>
            </nav>
            <ul className='nav-links'>
                {nav_items.map((item, index) => {
                    return (
                        <li key={index}>
                            <a
                                href={item.link}
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                {item.name}
                            </a>
                        </li>
                    );
                })}
                {address && (
                    <li>
                        <span onClick={disconnect}>SIGN OUT</span>
                    </li>
                )}
            </ul>
        </header>
    );
}

export default Header;

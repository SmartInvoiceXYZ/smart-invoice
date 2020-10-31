import React from 'react';

import Logo from '../assets/raidguild__logo.png';

const { nav_items } = require("../utils/Constants");

const Header = () => {
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
            </ul>
        </header>
    );
}

export default Header;
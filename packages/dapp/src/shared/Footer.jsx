import React from 'react';

import RaidGuild from '../assets/built-by-raid-guild.svg';

export const Footer = () => {
  return (
    <footer>
      <a href="https://raidguild.org" target="_blank" rel="noopener noreferrer">
        <img src={RaidGuild} alt="built-by-raid-guild" />
      </a>
    </footer>
  );
};

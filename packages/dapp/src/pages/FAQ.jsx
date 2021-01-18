import '../sass/faqStyles.scss';

import React from 'react';

import { ADDRESSES } from '../utils/constants';
import { getAddressLink } from '../utils/helpers';

const { DAI_TOKEN, FACTORY, WETH_TOKEN } = ADDRESSES;

export const FAQ = () => {
  return (
    <div className="main overlay">
      <div className="faq">
        <h2>frequently asked questions</h2>
        <p>
          INVOICE FACTORY:{' '}
          <a
            href={getAddressLink(FACTORY)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {FACTORY}
          </a>
        </p>
        <p>
          WRAPPED ETH:{' '}
          <a
            href={getAddressLink(WETH_TOKEN)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {WETH_TOKEN}
          </a>
        </p>
        <p>
          DAI:{' '}
          <a
            href={getAddressLink(DAI_TOKEN)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {DAI_TOKEN}
          </a>
        </p>
      </div>
    </div>
  );
};

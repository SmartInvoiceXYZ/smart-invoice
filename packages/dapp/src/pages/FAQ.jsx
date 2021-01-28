import '../sass/faqStyles.scss';

import React from 'react';

import { ADDRESSES, NETWORK } from '../utils/constants';
import { getAddressLink } from '../utils/helpers';

const { DAI_TOKEN, FACTORY, WRAPPED_TOKEN } = ADDRESSES;

export const FAQ = () => {
  return (
    <div className="main overlay">
      <div className="faq">
        <h2>frequently asked questions</h2>
        <p>NETWORK CHAIN ID: {NETWORK}</p>
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
          WRAPPED NATIVE TOKEN:{' '}
          <a
            href={getAddressLink(WRAPPED_TOKEN)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {WRAPPED_TOKEN}
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

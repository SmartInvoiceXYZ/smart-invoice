import React from 'react';

import {
  dai_token,
  weth_token,
  smart_invoices_factory,
} from '../utils/Constants';
import { getAddressLink } from '../utils/Helpers';
import '../sass/faqStyles.scss';

const FAQ = () => {
  return (
    <div className="faq">
      <h2>frequently asked questions</h2>
      <p>
        INVOICE FACTORY:{' '}
        <a
          href={getAddressLink(smart_invoices_factory)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {smart_invoices_factory}
        </a>
      </p>
      <p>
        WRAPPED ETH:{' '}
        <a
          href={getAddressLink(weth_token)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {weth_token}
        </a>
      </p>
      <p>
        DAI:{' '}
        <a
          href={getAddressLink(dai_token)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {dai_token}
        </a>
      </p>
    </div>
  );
};

export default FAQ;

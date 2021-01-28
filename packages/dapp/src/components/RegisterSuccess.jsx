import '../sass/registerSuccessStyles.scss';

import React, { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { CreateContext } from '../context/CreateContext';
import { Web3Context } from '../context/Web3Context';
import { getTxLink } from '../utils/helpers';
import { awaitInvoiceAddress } from '../utils/invoice';
import { Loader } from './Loader';

export const RegisterSuccess = () => {
  const { provider } = useContext(Web3Context);
  const { tx } = useContext(CreateContext);
  const [invoiceID, setInvoiceID] = useState();
  const history = useHistory();

  useEffect(() => {
    if (tx && provider) {
      awaitInvoiceAddress(provider, tx).then(id => {
        setInvoiceID(id);
      });
    }
  }, [tx, provider]);

  return (
    <div className="register-success">
      <p id="title">Invoice Registration Received</p>
      <p id="transaction-text">
        You can check the progress of your transaction{' '}
        <a href={getTxLink(tx.hash)} target="_blank" rel="noopener noreferrer">
          here
        </a>
        .
      </p>
      {invoiceID ? (
        <>
          <p id="info-text">
            Save this because you will need it to manage your invoice later:
          </p>
          <div>
            <span className="label">Your Invoice ID</span>
            <div className="value">
              <Link to={`/invoice/${invoiceID}`}>{invoiceID}</Link>
            </div>
          </div>
        </>
      ) : (
        <Loader size="80" />
      )}
      <button
        type="button"
        id="return-home-button"
        onClick={() => history.push('/')}
      >
        Return Home
      </button>
    </div>
  );
};

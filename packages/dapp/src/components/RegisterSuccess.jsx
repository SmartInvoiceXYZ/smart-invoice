import React, { useContext, useState, useEffect } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { CreateContext } from '../context/CreateContext';
import { awaitInvoiceAddress } from '../utils/Invoice';

import '../sass/registerSuccessStyles.scss';
import { getTxLink } from '../utils/Helpers';

const RegisterSuccess = props => {
  const { provider } = useContext(AppContext);
  const { tx } = useContext(CreateContext);
  const [invoiceID, setInvoiceID] = useState();

  useEffect(() => {
    if (tx && provider) {
      awaitInvoiceAddress(provider, tx).then(id => {
        console.log(id);
        setInvoiceID(id);
      });
    }
  }, [tx, provider]);

  return (
    <div className="register-success">
      <p id="title">Invoice Registration Received</p>
      <p id="transaction-text">
        You can check the progress of your transaction{' '}
        <a href={getTxLink(tx.hash)} target="_blank" rel="norefferer noopener">
          here
        </a>
        .
      </p>
      {invoiceID && (
        <>
          <p id="info-text">
            Save these details because you will need it to manage your invoice
            later:
          </p>
          <div>
            <label>Your Invoice ID</label>
            <p>{invoiceID}</p>
          </div>
          <div>
            <label>Link to Invoice</label>
            <Link
              href={`/invoice/${invoiceID}`}
            >{`${window.location.protocol}://${window.location.hostname}/invoice/${invoiceID}`}</Link>
          </div>
        </>
      )}
      <button id="return-home-button" onClick={() => props.history.push('/')}>
        Return Home
      </button>
    </div>
  );
};

export default withRouter(RegisterSuccess);

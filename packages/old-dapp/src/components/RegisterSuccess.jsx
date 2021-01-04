import React, {useContext, useState, useEffect} from 'react';
import {withRouter} from 'react-router-dom';
import {AppContext} from '../context/AppContext';
import {CreateContext} from '../context/CreateContext';
import {invoiceCount} from '../utils/Invoice';

import '../sass/registerSuccessStyles.scss';

const RegisterSuccess = props => {
  const {provider} = useContext(AppContext);
  const {tx} = useContext(CreateContext);
  const [invoiceID, setInvoiceID] = useState();

  useEffect(() => {
    if (provider) {
      invoiceCount(provider).then(c => setInvoiceID(c.toString()));
    }
  }, [provider]);

  useEffect(() => {
    if (tx) {
      tx.wait().then(() => console.log('invoice created'));
    }
  }, [tx]);

  return (
    <div className="register-success">
      <p id="title">Invoice Registration Received</p>
      <p id="transaction-text">
        You can check the progress of your transaction{' '}
        <a href={`https://rinkeby.etherscan.io/tx/${tx.hash}`}>here</a>.
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
            <p>{`${window.location.protocol}://${window.location.hostname}/invoice/${invoiceID}`}</p>
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

import '../sass/homeStyles.scss';

import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';

import { Web3Context } from '../context/Web3Context';

export const Home = () => {
  const { provider, address, connectAccount } = useContext(Web3Context);

  const history = useHistory();

  const createInvoice = async () => {
    if (!provider) {
      await connectAccount();
    }
    if (address === '') return;
    history.push('/create-invoice');
  };

  const viewInvoices = async () => {
    if (!provider) {
      await connectAccount();
    }
    if (address === '') return;
    history.push('/invoices');
  };

  return (
    <div className="main">
      <div className="home">
        <div>
          <button className="bg-red" onClick={createInvoice} type="button">
            CREATE A NEW SMART INVOICE
          </button>
          <p>or</p>
          <button className="bg-red" onClick={viewInvoices} type="button">
            VIEW EXISTING INVOICE
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useContext } from 'react';
import { withRouter } from 'react-router-dom';

import { AppContext } from '../context/AppContext';

import '../sass/homeStyles.scss';

const Home = props => {
  const { provider, address, connectAccount } = useContext(AppContext);

  const createInvoice = async () => {
    if (!provider) {
      await connectAccount();
    }
    if (address === '') return;
    props.history.push('/create-invoice');
  };

  const viewInvoices = async () => {
    if (!provider) {
      await connectAccount();
    }
    if (address === '') return;
    props.history.push('/invoices');
  };

  return (
    <div className="home">
      <div>
        <button className="bg-red" onClick={createInvoice}>
          CREATE A NEW SMART INVOICE
        </button>
        <p>or</p>
        <button className="bg-red" onClick={viewInvoices}>
          VIEW EXISTING INVOICE
        </button>
      </div>
    </div>
  );
};

export default withRouter(Home);

import React, {useContext} from 'react';
import {withRouter} from 'react-router-dom';

import {AppContext} from '../context/AppContext';

import '../sass/homeStyles.scss';

import RaidCastle from '../assets/raid__cloud__castle.png';

const Home = props => {
  const {provider, address, connectAccount} = useContext(AppContext);

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
      <img src={RaidCastle} id="raid-castle" alt="raid-castle" />
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

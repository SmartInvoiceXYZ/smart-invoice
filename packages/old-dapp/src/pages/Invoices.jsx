import React, {useEffect, useContext} from 'react';
import {withRouter} from 'react-router-dom';
import {AppContext} from '../context/AppContext';
import SearchContextProvider, {SearchContext} from '../context/SearchContext';

import '../sass/invoicesStyles.scss';

const Invoices = ({history}) => {
  const {search, setSearch, result} = useContext(SearchContext);
  const {address} = useContext(AppContext);

  useEffect(() => setSearch(address), [address, setSearch]);
  return (
    <div className="invoices">
      <div>
        <h3 id="invoices-title">View Existing</h3>
        <input
          type="text"
          value={search}
          placeholder="Search for Invoice"
          onChange={e => setSearch(e.target.value)}
        ></input>

        <div className="invoices-res">
          {result &&
            result.map(invoice => (
              <div
                className="invoices-res-item"
                onClick={() => history.push(`/invoice/${invoice.index}`)}
                key={invoice.index}
              >
                {invoice.projectName}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const InvoicesWithProvider = props => (
  <SearchContextProvider>
    <Invoices {...props} />
  </SearchContextProvider>
);

export default withRouter(InvoicesWithProvider);

import '../sass/invoicesStyles.scss';

import React, { useContext, useEffect } from 'react';
import { withRouter } from 'react-router-dom';

import { Loader } from '../components/Loader';
import { SearchContext, SearchContextProvider } from '../context/SearchContext';
import { Web3Context } from '../context/Web3Context';
import { useInvoiceStatus } from '../hooks/useInvoiceStatus';

const InvoiceStatusLabel = ({ invoice }) => {
  const { funded, label, loading } = useInvoiceStatus(invoice);
  return (
    <span className={`invoice-status ${funded ? 'funded' : ''}`}>
      {loading ? <Loader size="20" /> : label}
    </span>
  );
};

const InvoicesInner = ({ history }) => {
  const { search, setSearch, result, fetching } = useContext(SearchContext);
  const { address } = useContext(Web3Context);

  useEffect(() => {
    if (address) {
      setSearch(address);
    }
  }, [address, setSearch]);
  return (
    <div className="main">
      <div className="invoices">
        <div>
          <h3 id="invoices-title">View Existing</h3>
          <div className="input-box">
            <input
              type="text"
              value={search}
              placeholder="Search for Invoice"
              onChange={e => setSearch(e.target.value)}
            />
            {fetching && <Loader size="20" />}
          </div>

          <div className="invoices-res">
            {result &&
              result.map(invoice => (
                // eslint-disable-next-line
                <div
                  className="invoices-res-item"
                  onClick={() => history.push(`/invoice/${invoice.address}`)}
                  key={invoice.address}
                >
                  <span> {invoice.projectName} </span>
                  <InvoiceStatusLabel invoice={invoice} />
                </div>
              ))}
            {!fetching && result && result.length === 0 && (
              <div className="invoices-res-item">
                <span> No invoices found </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InvoicesWithProvider = props => (
  <SearchContextProvider>
    <InvoicesInner {...props} />
  </SearchContextProvider>
);

export const Invoices = withRouter(InvoicesWithProvider);

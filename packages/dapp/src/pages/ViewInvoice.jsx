import React from 'react';

import '../sass/viewInvoiceStyles.scss';

const ViewInvoice = () => {
  return (
    <div className="view-invoice">
      <div className="project-info">
        <h3 id="title">Top Secret Project</h3>
        <h5 id="description">
          Building magical infrastructure to support the ETH2 roadmap
        </h5>
        <a href="https://raidguild.org/">Link to details of agreement</a>
        <br></br>
        <p>Project Start Date: August 1 2020</p>
        <p>Project End Date: October 31, 2020</p>
        <p>Safety Valve Withdrawal Date: November 20, 2020</p>
        <p>Arbitration Provider: Aragon Court</p>
      </div>
      <div className="payment-info-container">
        <div className="payment-info">
          <div id="total-amount">
            <p>Total Project Amount</p>
            <p>10,000 DAI</p>
          </div>
          <div id="payment-milestone">
            <div>
              <p>Project Milestone #1</p>
              <p>4,000 DAI</p>
            </div>
            <div>
              <p>Project Milestone #2</p>
              <p>2,000 DAI</p>
            </div>
            <div>
              <p>Project Milestone #3</p>
              <p>4,000 DAI</p>
            </div>
          </div>
          <div id="due-amount">
            <p>Total Due Today</p>
            <p>4,000 DAI</p>
          </div>
        </div>
        <div className="invoice-buttons">
          <div id="secondary-buttons">
            <button id="lock-button">Lock</button>
            <button id="deposit-button">Deposit</button>
          </div>
          <button id="primary-button">Release</button>
        </div>
      </div>
    </div>
  );
};

export default ViewInvoice;

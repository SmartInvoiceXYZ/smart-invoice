import React, {useEffect, useState} from 'react';
import {BigNumber, utils} from 'ethers';

import '../sass/viewInvoiceStyles.scss';
import {getInvoice} from '../graphql/getInvoice';
import {getDateString, getResolverString, getToken} from '../utils/Helpers';

const ViewInvoice = ({
  match: {
    params: {invoiceId},
  },
}) => {
  const [invoice, setInvoice] = useState();

  useEffect(() => {
    if (invoiceId >= 0) {
      getInvoice(invoiceId).then(i => setInvoice(i));
    }
  }, [invoiceId]);

  if (!invoice) return null;

  const {
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
    terminationTime,
    resolverType,
    // numMilestones,
    amounts,
    total,
    token,
    released,
    balance,
  } = invoice;

  const tokenData = getToken(token);
  const {decimals, symbol} = tokenData;
  const due = BigNumber.from(total)
    .sub(BigNumber.from(released))
    .sub(BigNumber.from(balance));

  return (
    <div className="view-invoice">
      <div className="project-info">
        <h3 id="title">{projectName}</h3>
        <h5 id="description">{projectDescription}</h5>
        <a href={projectAgreement} target="_blank" rel="noopener noreferrer">
          Link to details of agreement
        </a>
        <br></br>
        <p>Project Start Date: {getDateString(startDate)}</p>
        <p>Project End Date: {getDateString(endDate)}</p>
        <p>Safety Valve Withdrawal Date: {getDateString(terminationTime)}</p>
        <p>Arbitration Provider: {getResolverString(resolverType)}</p>
      </div>
      <div className="payment-info-container">
        <div className="payment-info">
          <div id="total-amount">
            <p>Total Project Amount</p>
            <p>{`${utils.formatUnits(total, decimals)} ${symbol}`}</p>
          </div>
          <div id="payment-milestone">
            {amounts.map((amount, index) => (
              <div key={index + 1}>
                <p>Project Milestone #{index + 1}</p>
                <p>{`${utils.formatUnits(amount, decimals)} ${symbol}`}</p>
              </div>
            ))}
          </div>
          <div id="due-amount">
            <p>Total Due Today</p>
            <p>{`${utils.formatUnits(due, decimals)} ${symbol}`}</p>
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

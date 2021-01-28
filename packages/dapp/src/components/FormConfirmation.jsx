import { utils } from 'ethers';
import React, { useContext } from 'react';

import { CreateContext } from '../context/CreateContext';
import { getDateString, getResolverString, getToken } from '../utils/helpers';

export const FormConfirmation = () => {
  const {
    projectName,
    projectDescription,
    projectAgreement,
    clientAddress,
    paymentAddress,
    startDate,
    endDate,
    safetyValveDate,
    arbitrationProvider,
    milestones,
    paymentDue,
    paymentToken,
  } = useContext(CreateContext);
  const tokenData = getToken(paymentToken);
  const { decimals, symbol } = tokenData;
  return (
    <section className="form-confirmation">
      <p id="project-title">{projectName}</p>
      {projectDescription && <p>{projectDescription}</p>}
      <a href={projectAgreement} target="_blank" rel="noopener noreferrer">
        {projectAgreement}
      </a>
      <div>
        <p>Client Address:</p>
        <p>{clientAddress}</p>
      </div>
      <div>
        <p>Client Address:</p>
        <p>{clientAddress}</p>
      </div>
      <div>
        <p>Payment Address:</p>
        <p>{paymentAddress}</p>
      </div>
      {startDate && (
        <div>
          <p>Project Start Date:</p>
          <p>{getDateString(startDate / 1000)}</p>
        </div>
      )}
      {endDate && (
        <div>
          <p>Expected End Date:</p>
          <p>{getDateString(endDate / 1000)}</p>
        </div>
      )}
      <div>
        <p>Safety Valve Date:</p>
        <p>{getDateString(safetyValveDate / 1000)}</p>
      </div>
      <div>
        <p>Arbitration Provider:</p>
        <p>{getResolverString(arbitrationProvider)}</p>
      </div>
      <hr />
      <div className="total-payment-info">
        <p>{milestones} Payments</p>
        <p>
          {utils.formatUnits(paymentDue, decimals)} {symbol} Total
        </p>
      </div>
    </section>
  );
};

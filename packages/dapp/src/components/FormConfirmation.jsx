import React, {useContext} from 'react';
import {utils} from 'ethers';
import {CreateContext} from '../context/CreateContext';
import {getToken, getDateString} from '../utils/Helpers';

const FormConfirmation = () => {
  const context = useContext(CreateContext);
  const tokenData = getToken(context.paymentToken);
  const {decimals, symbol} = tokenData;
  return (
    <section className="form-confirmation">
      <p id="project-title">{context.projectName}</p>
      <p>{context.projectDescription}</p>
      <a href={context.projectAgreement}>{context.projectAgreement}</a>
      <div>
        <p>Client Address:</p>
        <p>{context.clientAddress}</p>
      </div>
      <div>
        <p>Payment Address:</p>
        <p>{context.paymentAddress}</p>
      </div>
      {context.startDate && (
        <div>
          <p>Project Start Date:</p>
          <p>{getDateString(context.startDate / 1000)}</p>
        </div>
      )}
      {context.endDate && (
        <div>
          <p>Expected End Date:</p>
          <p>{getDateString(context.endDate / 1000)}</p>
        </div>
      )}
      <div>
        <p>Safety Valve Date:</p>
        <p>{getDateString(context.safetyValveDate / 1000)}</p>
      </div>
      <div>
        <p>Arbitration Provider:</p>
        <p>{context.arbitrationProvider}</p>
      </div>
      <hr></hr>
      <div className="total-payment-info">
        <p>{context.milestones} Payments</p>
        <p>
          {utils.formatUnits(context.paymentDue, decimals)} {symbol} Total
        </p>
      </div>
    </section>
  );
};

export default FormConfirmation;

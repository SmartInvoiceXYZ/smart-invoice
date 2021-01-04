import React, {useContext} from 'react';
import {utils} from 'ethers';
import {CreateContext} from '../context/CreateContext';
import {getToken} from '../utils/Helpers';

const ProjectChunksForm = () => {
  const context = useContext(CreateContext);
  const tokenData = getToken(context.paymentToken);
  const {decimals, symbol} = tokenData;
  return (
    <section className="payment-chunks-form">
      {Array.from(Array(Number(context.milestones))).map((_val, index) => {
        return (
          <div className="parallel-inputs" key={index}>
            <div className="ordered-inputs">
              <label>Payment {index + 1}</label>
              <div className="input-symbol">
                <input
                  type="text"
                  onChange={e => {
                    if (!e.target.value || isNaN(Number(e.target.value)))
                      return;
                    const amount = utils.parseEther(e.target.value);
                    const newPayments = context.payments.slice();
                    newPayments[index] = amount;
                    context.setPayments(newPayments);
                  }}
                ></input>
                <span>{symbol}</span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="info-note">
        Total Amount Must Add Up to{' '}
        {utils.formatUnits(context.paymentDue, decimals)} {symbol}
      </div>
    </section>
  );
};

export default ProjectChunksForm;

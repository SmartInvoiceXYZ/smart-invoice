import { utils } from 'ethers';
import React, { useContext } from 'react';

import { CreateContext } from '../context/CreateContext';
import { getToken } from '../utils/helpers';

export const PaymentChunksForm = () => {
  const {
    paymentToken,
    milestones,
    payments,
    setPayments,
    paymentDue,
  } = useContext(CreateContext);
  const tokenData = getToken(paymentToken);
  const { decimals, symbol } = tokenData;
  return (
    <section className="payment-chunks-form">
      {Array.from(Array(Number(milestones))).map((_val, index) => {
        return (
          <div className="parallel-inputs" key={index.toString()}>
            <div className="ordered-inputs">
              <label>Payment {index + 1}</label>
              <div className="input-symbol">
                <input
                  type="text"
                  onChange={e => {
                    if (!e.target.value || isNaN(Number(e.target.value)))
                      return;
                    const amount = utils.parseEther(e.target.value);
                    const newPayments = payments.slice();
                    newPayments[index] = amount;
                    setPayments(newPayments);
                  }}
                />
                <span>{symbol}</span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="info-note">
        Total Amount Must Add Up to {utils.formatUnits(paymentDue, decimals)}{' '}
        {symbol}
      </div>
    </section>
  );
};

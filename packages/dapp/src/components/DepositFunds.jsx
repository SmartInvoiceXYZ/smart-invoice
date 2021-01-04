import React, {useState, useContext} from 'react';
import {utils} from 'ethers';
import {getToken} from '../utils/Helpers';
import {AppContext} from '../context/AppContext';

import '../sass/depositFunds.scss';
export const DepositFunds = ({invoice, balance}) => {
  const {address, token, amounts} = invoice;
  const {provider} = useContext(AppContext);
  const [amount, setAmount] = useState(0);
  const tokenData = getToken(token);
  const {decimals, symbol} = tokenData;
  const deposit = () => {
    if (!amount || isNaN(Number(amount)) || !provider) return;
    const bigAmount = utils.parseUnits(amount, decimals);
    provider.getSigner().sendTransaction({to: address, value: bigAmount});
  };
  console.log({invoice});
  return (
    <div className="deposit-funds">
      <h1> PAY INVOICE </h1>
      <p className="modal-note">
        At a minimum, you’ll need to deposit enough to cover the first project
        payment.
      </p>

      <p className="amount-heading">How much will you be depositing today?</p>
      {amounts.map((amount, index) => {
        return (
          <sl-checkbox key={index.toString()}>
            Payment #{index + 1} &nbsp; &nbsp;
            {utils.formatUnits(amount, decimals)} {symbol}
          </sl-checkbox>
        );
      })}

      <div className="control has-icons-right">
        <span className="label"> Amount </span>
        <input
          className="input"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount to Deposit"
        />
        <span className="icon is-right">{symbol}</span>
      </div>
      <button onClick={deposit}>Deposit</button>
    </div>
  );
};

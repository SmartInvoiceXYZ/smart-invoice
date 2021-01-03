import React, {useState, useContext} from 'react';
import {utils} from 'ethers';
import {getToken} from '../utils/Helpers';
import {AppContext} from '../context/AppContext';

import '../sass/depositFunds.scss';
export const DepositFunds = ({invoice: {address, token}}) => {
  const {provider} = useContext(AppContext);
  const [amount, setAmount] = useState(0);
  const tokenData = getToken(token);
  const {decimals, symbol} = tokenData;
  const deposit = () => {
    if (!amount || isNaN(Number(amount)) || !provider) return;
    const bigAmount = utils.parseUnits(amount, decimals);
    provider.getSigner().sendTransaction({to: address, value: bigAmount});
  };
  return (
    <div className="deposit-funds">
      <h1> Deposit Funds </h1>
      <p className="modal-note">
        Please ensure that you're sending the token that's accepted by the
        invoice ONLY.
      </p>

      <div class="control has-icons-right">
        <input
          className="input"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount to Deposit"
        />
        <span className="icon is-right">{symbol}</span>
      </div>
      <button className="button is-black" onClick={deposit}>
        Deposit
      </button>
    </div>
  );
};

import React, { useState, useEffect, useContext, useRef } from 'react';
import { utils, BigNumber } from 'ethers';
import { getToken } from '../utils/Helpers';
import { AppContext } from '../context/AppContext';

import '../sass/depositFunds.scss';
export const DepositFunds = ({ invoice, balance }) => {
  const { address, token, amounts } = invoice;
  const numAmounts = amounts.length;
  const { provider } = useContext(AppContext);
  const [amount, setAmount] = useState(BigNumber.from(0));
  const [amountInput, setAmountInput] = useState('');
  const tokenData = getToken(token);
  const { decimals, symbol } = tokenData;
  const deposit = () => {
    if (!amount || !provider) return;
    // provider.getSigner().sendTransaction({ to: address, value: amount });
  };
  const amountsRef = useRef(null);

  useEffect(() => {
    if (amountsRef.current) {
      for (let i = 0; i < numAmounts; i += 1) {
        const checkbox = amountsRef.current.children[i];
        checkbox.addEventListener('sl-change', () => {
          if (checkbox.checked) {
            setAmountInput(_input => {
              const amt = _input
                ? utils.parseUnits(_input, decimals)
                : BigNumber.from(0);
              return utils.formatUnits(amt.add(amounts[i]), decimals);
            });
          } else {
            setAmountInput(_input => {
              const amt = _input
                ? utils.parseUnits(_input, decimals)
                : BigNumber.from(0);
              return amt.gt(amounts[i])
                ? utils.formatUnits(amt.sub(amounts[i]), decimals)
                : '0';
            });
          }
        });
      }
    }
  }, [amountsRef, numAmounts]);

  useEffect(() => {
    if (amountInput) {
      setAmount(utils.parseUnits(amountInput, decimals));
    }
  }, [amountInput]);
  let sum = BigNumber.from(0);
  return (
    <div className="deposit-funds">
      <h1> PAY INVOICE </h1>
      <p className="modal-note">
        At a minimum, you’ll need to deposit enough to cover the first project
        payment.
      </p>

      <p className="amount-heading">How much will you be depositing today?</p>
      <div className="amount-details" ref={amountsRef}>
        {amounts.map((a, i) => {
          sum = sum.add(a);
          return (
            <sl-checkbox
              key={i.toString()}
              value={a}
              name={i}
              checked={balance.gte(sum)}
              disabled={balance.gte(sum)}
            >
              Payment #{i + 1} &nbsp; &nbsp;
              {utils.formatUnits(a, decimals)} {symbol}
            </sl-checkbox>
          );
        })}
      </div>

      <div className="control has-icons-right">
        <span className="label"> Amount </span>
        <input
          className="input"
          type="number"
          value={amountInput}
          onChange={e => setAmountInput(e.target.value)}
          placeholder="Amount to Deposit"
        />
        <span className="icon is-right">{symbol}</span>
      </div>
      <button onClick={deposit}>Deposit</button>
    </div>
  );
};

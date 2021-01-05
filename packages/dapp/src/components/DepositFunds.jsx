import React, { useState, useEffect, useContext, useRef } from 'react';
import { utils, BigNumber, Contract } from 'ethers';
import { getToken } from '../utils/Helpers';
import { weth_token } from '../utils/Constants';
import { AppContext } from '../context/AppContext';

import '../sass/depositFunds.scss';
export const DepositFunds = ({ invoice, balance }) => {
  const { address, token, amounts } = invoice;
  const [paymentType, setPaymentType] = useState(0);
  const numAmounts = amounts.length;
  const { provider } = useContext(AppContext);
  const [amount, setAmount] = useState(BigNumber.from(0));
  const [amountInput, setAmountInput] = useState('');
  const tokenData = getToken(token);
  const { decimals, symbol } = tokenData;
  const deposit = () => {
    if (!amount || !provider) return;
    if (paymentType === 1) {
      provider.getSigner().sendTransaction({ to: address, value: amount });
    } else {
      const abi = ['function transfer(address, uint256) public'];
      const tokenContract = new Contract(token, abi, provider.getSigner());
      tokenContract.transfer(address, amount);
    }
  };
  const amountsRef = useRef(null);
  const isWETH = token.toLowerCase() === weth_token;

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
  }, [amountsRef, numAmounts, amounts, decimals]);

  useEffect(() => {
    if (amountInput) {
      setAmount(utils.parseUnits(amountInput, decimals));
    }
  }, [amountInput, decimals]);

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
        {isWETH ? (
          <select
            className="icon is-right"
            onChange={e => setPaymentType(Number(e.target.value))}
            value={paymentType}
          >
            <option value="0">{symbol}</option>
            <option value="1">ETH</option>
          </select>
        ) : (
          <span className="icon is-right">{symbol}</span>
        )}
      </div>
      <button onClick={deposit}>Deposit</button>
    </div>
  );
};

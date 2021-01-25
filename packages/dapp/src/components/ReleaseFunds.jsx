import '../sass/releaseFunds.scss';

import React, { useState, useEffect, useContext } from 'react';

import { Web3Context } from '../context/Web3Context';
import { release } from '../utils/invoice';
import { BigNumber, utils } from 'ethers';
import { getToken } from '../utils/helpers';

export const ReleaseFunds = ({ invoice, balance, close }) => {
  const [loading, setLoading] = useState(false);
  const { provider } = useContext(Web3Context);
  const { invoiceId, currentMilestone, amounts, address, token } = invoice;

  let amount = BigNumber.from(amounts[currentMilestone]);
  amount =
    currentMilestone === amounts.length - 1 && amount.lt(balance)
      ? balance
      : amounts[currentMilestone];

  const { decimals, symbol } = getToken(token);

  useEffect(() => {
    const send = async () => {
      try {
        setLoading(true);
        const tx = await release(provider, address);
        await tx.wait();
        setLoading(false);
        window.location.href = `/invoice/${invoiceId}`;
      } catch (releaseError) {
        //eslint-disable-next-line
        console.error({ releaseError });
      }
    };
    if (!loading && provider && balance && balance.gte(amount)) {
      send();
    } else {
      close();
    }
  }, [amount, address, provider, balance, close, loading, invoiceId]);

  return (
    <div className="release-funds">
      <h1> Release Funds </h1>
      <p className="modal-note">
        Follow the instructions in your wallet to release funds from escrow to
        the project team.
      </p>
      <div className="release-amount">
        <p className="label"> Amount To Be Released </p>
        <p className="value">{`${utils.formatUnits(
          amount,
          decimals,
        )} ${symbol}`}</p>
      </div>
      <button type="button" onClick={close}>
        Close
      </button>
    </div>
  );
};

import React from 'react';

import '../sass/depositFunds.scss';
export const DepositFunds = () => {
  return (
    <div className="deposit-funds">
      <h1> Deposit Funds </h1>
      <p className="modal-note">
        Locking freezes all remaining funds in the contract and initiates a
        dispute.
      </p>
      <p>
        Once a dispute has been initated, Aragon Court will review your case,
        including the project agreement and dispute reason to make a decision on
        how to fairly distribute remaining funds.
      </p>
    </div>
  );
};

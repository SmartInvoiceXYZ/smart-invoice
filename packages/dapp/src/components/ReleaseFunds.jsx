import '../sass/releaseFunds.scss';

import React from 'react';

export const ReleaseFunds = () => {
  return (
    <div className="release-funds">
      <h1> Release Funds </h1>
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

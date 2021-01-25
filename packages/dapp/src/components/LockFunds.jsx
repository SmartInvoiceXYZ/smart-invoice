import '../sass/lockFunds.scss';

import { BigNumber, utils } from 'ethers';
import React, { useContext, useCallback, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { getResolverString, getToken } from '../utils/helpers';
import { lock } from '../utils/invoice';
import { uploadDisputeDetails } from '../utils/ipfs';
import { Loader } from './Loader';
import { ReactComponent as LockImage } from '../assets/lock.svg';

export const LockFunds = ({ invoice, balance, close }) => {
  const { provider } = useContext(Web3Context);
  const { isLocked, address, resolverType, token } = invoice;
  console.log(invoice);
  const resolver = getResolverString(resolverType);
  const { decimals, symbol } = getToken(token);
  const [disputeReason, setDisputeReason] = useState('');
  const fee =
    resolverType === 'lex_dao'
      ? `${utils.formatUnits(
          BigNumber.from(balance).mul(5).div(100),
          decimals,
        )} ${symbol}`
      : `150 DAI`;

  const [showLexDAOSteps] = useState(false);
  const [locking, setLocking] = useState(false);

  const lockFunds = useCallback(async () => {
    if (provider && !locking && balance.gt(0) && disputeReason) {
      setLocking(true);

      const detailsHash = await uploadDisputeDetails({
        reason: disputeReason,
        invoice: address,
        amount: balance.toString(),
      });

      try {
        const tx = await lock(provider, address, detailsHash);
        console.log({ tx: tx.hash });
        await tx.wait();
        window.location.href = `/invoice/${address}`;
      } catch (lockError) {
        //eslint-disable-next-line
        console.error({ lockError });
      }

      setLocking(false);
    }
  }, [provider, locking, balance, address, disputeReason]);

  if (locking) {
    return (
      <div className="lock-funds">
        <h1> Locking Funds </h1>
        <div className="locking-funds">
          <Loader size="6rem" />
          <LockImage className="image" />
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="lock-funds">
        <h1> Funds Locked </h1>
        <div className="locking-funds">
          <LockImage className="image locked" />
        </div>
      </div>
    );
  }

  return (
    <div className="lock-funds">
      <h1> Lock Funds </h1>

      {!showLexDAOSteps ? (
        <>
          <p className="modal-note">
            Locking freezes all remaining funds in the contract and initiates a
            dispute.
          </p>
          <p>
            Once a dispute has been initated, {resolver} will review your case,
            including the project agreement and dispute reason to make a
            decision on how to fairly distribute remaining funds.
          </p>
          <div className="ordered-inputs">
            <p className="tooltip">
              <sl-tooltip content="Why do you want to lock these funds?">
                <i className="far fa-question-circle" />
              </sl-tooltip>
            </p>
            <label>Dispute Reason</label>
            <input
              type="text"
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
            />
          </div>
          <p className="lock-note">
            <u>{resolver}</u> charges a {fee} fee to resolve this dispute. This
            amount will be deducted from the locked fund amount.
          </p>
          <button type="button" onClick={lockFunds}>
            Lock {utils.formatUnits(balance, decimals)} {symbol}
          </button>
          <a
            target="_blank"
            href={
              resolverType === 'lex_dao'
                ? 'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver'
                : 'https://anj.aragon.org/legal/terms-general.pdf'
            }
            rel="noreferrer noopener"
          >
            Learn about {resolver} dispute process & terms
          </a>
        </>
      ) : (
        <>
          <LexDAOSteps close={close} />
        </>
      )}
    </div>
  );
};

const LexDAOSteps = ({ close }) => {
  return (
    <>
      <button type="button" onClick={close}>
        Close
      </button>
    </>
  );
};

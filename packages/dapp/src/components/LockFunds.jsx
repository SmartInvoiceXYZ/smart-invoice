import '../sass/lockFunds.scss';

import { BigNumber, utils } from 'ethers';
import React, { useCallback, useContext, useState } from 'react';

import { ReactComponent as LockImage } from '../assets/lock.svg';
import { Web3Context } from '../context/Web3Context';
import { ADDRESSES } from '../utils/constants';
import { getResolverString, getToken, getTxLink } from '../utils/helpers';
import { lock } from '../utils/invoice';
import { uploadDisputeDetails } from '../utils/ipfs';
import { Loader } from './Loader';

const { ARAGON_COURT, LEX_DAO } = ADDRESSES;

export const LockFunds = ({ invoice, balance, close }) => {
  const { provider } = useContext(Web3Context);
  const { isLocked, address, resolver, token } = invoice;
  const resolverString = getResolverString(resolver);
  const { decimals, symbol } = getToken(token);
  const [disputeReason, setDisputeReason] = useState('');
  const fee =
    resolver !== ARAGON_COURT
      ? `${utils.formatUnits(
          BigNumber.from(balance).div(20),
          decimals,
        )} ${symbol}`
      : `150 DAI`;

  const [showLexDAOSteps] = useState(false);
  const [locking, setLocking] = useState(false);
  const [transaction, setTransaction] = useState();

  const lockFunds = useCallback(async () => {
    if (provider && !locking && balance.gt(0)) {
      setLocking(true);
      const detailsHash = await uploadDisputeDetails({
        reason: disputeReason,
        invoice: address,
        amount: balance.toString(),
      });

      try {
        const tx = await lock(provider, address, detailsHash);
        setTransaction(tx);
        await tx.wait();
        window.location.href = `/invoice/${address}`;
      } catch (lockError) {
        // eslint-disable-next-line
        console.error({ lockError });
      }

      setLocking(false);
    }
  }, [provider, locking, balance, address, disputeReason]);

  if (locking) {
    return (
      <div className="lock-funds">
        <h1> Locking Funds </h1>
        {transaction && (
          <a
            href={getTxLink(transaction.hash)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Transaction on Explorer
          </a>
        )}
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
        {transaction && (
          <a
            href={getTxLink(transaction.hash)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Transaction on Explorer
          </a>
        )}
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
            Once a dispute has been initated, {resolverString} will review your
            case, including the project agreement and dispute reason to make a
            decision on how to fairly distribute remaining funds.
          </p>
          <div className="ordered-inputs">
            <p className="tooltip">
              <sl-tooltip content="Why do you want to lock these funds?">
                <i className="far fa-question-circle" />
              </sl-tooltip>
            </p>
            <label>Dispute Reason</label>
            <textarea
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
            />
          </div>
          <p className="lock-note">
            <u>{resolver}</u> charges a {fee} fee to resolve this dispute. This
            amount will be deducted from the locked fund amount.
          </p>
          <button type="button" onClick={lockFunds}>
            {`Lock ${utils.formatUnits(balance, decimals)} ${symbol}`}
          </button>
          {[LEX_DAO, ARAGON_COURT].indexOf(resolver) !== -1 && (
            <a
              target="_blank"
              href={
                resolver === LEX_DAO
                  ? 'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver'
                  : 'https://anj.aragon.org/legal/terms-general.pdf'
              }
              rel="noreferrer noopener"
            >
              Learn about {resolver} dispute process & terms
            </a>
          )}
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

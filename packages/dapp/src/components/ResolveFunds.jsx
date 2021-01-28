import '../sass/resolveFunds.scss';

import { BigNumber, utils } from 'ethers';
import React, { useContext, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { getToken, getTxLink } from '../utils/helpers';
import { resolve } from '../utils/invoice';
import { uploadDisputeDetails } from '../utils/ipfs';
import { Loader } from './Loader';

export const ResolveFunds = ({ invoice, balance, close }) => {
  const { address, token, isLocked } = invoice;
  const { provider } = useContext(Web3Context);
  const tokenData = getToken(token);
  const { decimals, symbol } = tokenData;
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState();
  const resolverAward = balance.div(20);
  const availableFunds = balance.sub(resolverAward);
  const [clientAward, setClientAward] = useState(availableFunds);
  const [providerAward, setProviderAward] = useState(BigNumber.from(0));
  const [clientAwardInput, setClientAwardInput] = useState(
    utils.formatUnits(availableFunds, decimals),
  );
  const [providerAwardInput, setProviderAwardInput] = useState('0');
  const [comments, setComments] = useState('');

  const resolveFunds = async () => {
    if (
      !provider ||
      !isLocked ||
      !balance.eq(clientAward.add(providerAward).add(resolverAward))
    )
      return;
    try {
      setLoading(true);
      const detailsHash = await uploadDisputeDetails({
        comments,
        invoice: address,
        amount: balance.toString(),
      });
      const tx = await resolve(
        provider,
        address,
        clientAward,
        providerAward,
        detailsHash,
      );
      setTransaction(tx);
      await tx.wait();
      window.location.href = `/invoice/${address}`;
    } catch (depositError) {
      // eslint-disable-next-line
      console.error({ depositError });
    }
    setLoading(false);
  };

  return (
    <div className="resolve-funds">
      <h1> RESOLVE DISPUTE </h1>
      <p className="modal-note">
        {isLocked
          ? `You’ll need to equally distibute the total balance of ${utils.formatUnits(
              balance,
              decimals,
            )} ${symbol} between the client and provider, excluding the 5% arbitration fee which you shall receive.`
          : `Invoice is not locked`}
      </p>
      {isLocked ? (
        <>
          <div className="ordered-inputs">
            <p className="tooltip">
              <sl-tooltip content="Comments for resolution?">
                <i className="far fa-question-circle" />
              </sl-tooltip>
            </p>
            <label>Resolution Comments</label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
            />
          </div>

          <div className="control has-icons-right">
            <span className="label"> Client Award </span>
            <input
              className="input"
              type="number"
              value={clientAwardInput}
              onChange={e => {
                setClientAwardInput(e.target.value);
                if (e.target.value) {
                  let award = utils.parseUnits(e.target.value, decimals);
                  if (award.gt(availableFunds)) {
                    award = availableFunds;
                    setClientAwardInput(utils.formatUnits(award, decimals));
                  }
                  setClientAward(award);
                  award = availableFunds.sub(award);
                  setProviderAward(award);
                  setProviderAwardInput(utils.formatUnits(award, decimals));
                }
              }}
              placeholder="Client Award"
            />
            <span className="icon is-right">{symbol}</span>
          </div>
          <div className="control has-icons-right">
            <span className="label"> Provider Award </span>
            <input
              className="input"
              type="number"
              value={providerAwardInput}
              onChange={e => {
                setProviderAwardInput(e.target.value);
                if (e.target.value) {
                  let award = utils.parseUnits(e.target.value, decimals);
                  if (award.gt(availableFunds)) {
                    award = availableFunds;
                    setProviderAwardInput(utils.formatUnits(award, decimals));
                  }
                  setProviderAward(award);
                  award = availableFunds.sub(award);
                  setClientAward(award);
                  setClientAwardInput(utils.formatUnits(award, decimals));
                }
              }}
              placeholder="Provider Award"
            />
            <span className="icon is-right">{symbol}</span>
          </div>
          <div className="control has-icons-right">
            <span className="label"> Resolver Award </span>
            <input
              className="input"
              type="number"
              value={utils.formatUnits(resolverAward, decimals)}
              disabled
            />
            <span className="icon is-right">{symbol}</span>
          </div>
          <button
            type="submit"
            onClick={resolveFunds}
            className="submit-button"
          >
            {loading ? <Loader size="20" color="#ffffff" /> : 'Resolve'}
          </button>
          {transaction && (
            <a
              href={getTxLink(transaction.hash)}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Transaction on Explorer
            </a>
          )}
        </>
      ) : (
        <button type="button" onClick={close} className="close-button">
          Close
        </button>
      )}
    </div>
  );
};

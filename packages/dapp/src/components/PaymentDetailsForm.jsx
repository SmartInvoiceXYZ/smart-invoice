import { BigNumber, utils } from 'ethers';
import React, { useContext, useEffect, useRef } from 'react';

import { CreateContext } from '../context/CreateContext';
import { ADDRESSES } from '../utils/constants';
import { getToken } from '../utils/helpers';

const { DAI_TOKEN, WETH_TOKEN } = ADDRESSES;

export const PaymentDetailsForm = () => {
  const {
    clientAddress,
    setClientAddress,
    paymentAddress,
    setPaymentAddress,
    paymentToken,
    setPaymentToken,
    paymentDue,
    setPaymentDue,
    milestones,
    setMilestones,
    arbitrationProvider,
    setArbitrationProvider,
    setPayments,
    termsAccepted,
    setTermsAccepted,
  } = useContext(CreateContext);
  const checkBox = useRef(null);
  useEffect(() => {
    if (checkBox.current) {
      checkBox.current.addEventListener('sl-change', () =>
        setTermsAccepted(c => !c),
      );
    }
  }, [checkBox, setTermsAccepted]);
  const tokenData = getToken(paymentToken);
  const { decimals, symbol } = tokenData;
  return (
    <section className="payment-details-form">
      <div className="ordered-inputs">
        <p className="tooltip">
          <sl-tooltip content="This will be the address used to access the invoice">
            <i className="far fa-question-circle" />
          </sl-tooltip>
        </p>
        <label>Client Address</label>
        <input
          type="text"
          value={clientAddress}
          onChange={e => setClientAddress(e.target.value)}
        />
      </div>
      <div className="ordered-inputs">
        <p className="tooltip">
          <sl-tooltip content="eg. Multisig, Gnosis safe">
            <i className="far fa-question-circle" />
          </sl-tooltip>
        </p>
        <label>Payment Address</label>
        <input
          type="text"
          value={paymentAddress}
          onChange={e => setPaymentAddress(e.target.value)}
        />
      </div>
      <div className="parallel-inputs">
        <div className="ordered-inputs">
          <label>Total Payment Due</label>
          <input
            type="number"
            onChange={e => {
              if (e.target.value && !isNaN(Number(e.target.value))) {
                setPaymentDue(utils.parseEther(e.target.value));
              } else {
                setPaymentDue(BigNumber.from(0));
              }
            }}
          />
        </div>
        <div className="ordered-inputs">
          <label>Payment Token</label>
          <select
            value={paymentToken}
            onChange={e => setPaymentToken(e.target.value)}
          >
            <option value={DAI_TOKEN}>DAI</option>
            <option value={WETH_TOKEN}>wETH</option>
          </select>
        </div>
        <div className="ordered-inputs">
          <p className="tooltip">
            <sl-tooltip content="Number of milestones in which the total payment will be processed">
              <i className="far fa-question-circle" />
            </sl-tooltip>
          </p>
          <label>Number of Payments</label>
          <input
            type="number"
            value={milestones}
            onChange={e => {
              const numMilestones = e.target.value ? Number(e.target.value) : 1;
              setMilestones(numMilestones);
              setPayments(
                Array(numMilestones)
                  .fill(1)
                  .map(() => {
                    return BigNumber.from(0);
                  }),
              );
            }}
          />
        </div>
      </div>
      <div className="parallel-inputs">
        <div className="ordered-inputs">
          <p className="tooltip">
            <sl-tooltip content="Arbitration provider that will be used incase of a dispute">
              <i className="far fa-question-circle" />
            </sl-tooltip>
          </p>
          <label>Arbitration Provider</label>
          <select
            value={arbitrationProvider}
            onChange={e => setArbitrationProvider(e.target.value)}
          >
            <option value="Lex">Lex DAO</option>
            <option value="Aragon Court">Aragon Court</option>
          </select>
        </div>
        <div className="ordered-inputs">
          <p className="tooltip">
            <sl-tooltip content="The fee that is used to resolve the issue in case of a dispute">
              <i className="far fa-question-circle" />
            </sl-tooltip>
          </p>
          <label>Max Fee</label>
          <input
            type="text"
            disabled
            value={
              arbitrationProvider === 'Lex'
                ? `${utils.formatUnits(
                    paymentDue.mul(5).div(100),
                    decimals,
                  )} ${symbol}`
                : `150 DAI`
            }
          />
        </div>
        <div className="ordered-inputs">
          {arbitrationProvider === 'Lex' ? (
            <p id="arb-fee-desc">
              LexDAO deducts a 5% arbitration fee from remaining funds in the
              case of dispute
            </p>
          ) : (
            <p id="arb-fee-desc">
              Aragon Court deducts a fixed fee at the creation time of dispute
            </p>
          )}
        </div>
      </div>
      {arbitrationProvider === 'Lex' ? (
        <sl-checkbox
          value={termsAccepted}
          checked={termsAccepted}
          ref={checkBox}
        >
          I agree to LexDAO{' '}
          <a
            target="_blank"
            href="https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver "
            rel="noreferrer noopener"
          >
            terms of service
          </a>
        </sl-checkbox>
      ) : (
        <sl-checkbox
          value={termsAccepted}
          checked={termsAccepted}
          ref={checkBox}
        >
          I agree to Aragon Court{' '}
          <a
            target="_blank"
            href="https://anj.aragon.org/legal/terms-general.pdf"
            rel="noreferrer noopener"
          >
            terms of service
          </a>
        </sl-checkbox>
      )}
    </section>
  );
};

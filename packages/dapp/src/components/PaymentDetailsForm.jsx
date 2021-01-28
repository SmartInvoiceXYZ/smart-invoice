import { BigNumber, utils } from 'ethers';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { CreateContext } from '../context/CreateContext';
import { ADDRESSES } from '../utils/constants';
import { getResolverString, getToken } from '../utils/helpers';

const { DAI_TOKEN, WRAPPED_TOKEN, ARAGON_COURT, LEX_DAO } = ADDRESSES;

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
  const [arbitrationProviderType, setArbitrationProviderType] = useState('0');
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
          <sl-tooltip content="Recipient of the funds">
            <i className="far fa-question-circle" />
          </sl-tooltip>
        </p>
        <label>Provider Address</label>
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
            <option value={DAI_TOKEN}>{getToken(DAI_TOKEN).symbol}</option>
            <option value={WRAPPED_TOKEN}>
              {getToken(WRAPPED_TOKEN).symbol}
            </option>
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
            value={arbitrationProviderType}
            onChange={e => {
              setArbitrationProviderType(e.target.value);
              switch (e.target.value) {
                case '1':
                  setArbitrationProvider(ARAGON_COURT);
                  setTermsAccepted(false);
                  break;
                case '2':
                  setArbitrationProvider('');
                  setTermsAccepted(true);
                  break;
                case '0':
                default:
                  setArbitrationProvider(LEX_DAO);
                  setTermsAccepted(false);
              }
            }}
          >
            <option value="0">LexDAO</option>
            {/* <option value="1">Aragon Court</option> */}
            <option value="2">Custom</option>
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
              arbitrationProvider !== ARAGON_COURT
                ? `${utils.formatUnits(paymentDue.div(20), decimals)} ${symbol}`
                : `150 DAI`
            }
          />
        </div>
        <div className="ordered-inputs">
          <p id="arb-fee-desc">
            {arbitrationProvider === ARAGON_COURT
              ? 'Aragon Court deducts a fixed fee at the creation time of dispute'
              : 'A 5% arbitration fee will be deducted from remaining funds during dispute resolution'}
          </p>
        </div>
      </div>
      {[LEX_DAO, ARAGON_COURT].indexOf(arbitrationProvider) === -1 ? (
        <div className="ordered-inputs">
          <p className="tooltip">
            <sl-tooltip content="This will be the address used to resolve any disputes on the invoice">
              <i className="far fa-question-circle" />
            </sl-tooltip>
          </p>
          <label>Arbitration Provider Address</label>
          <input
            type="text"
            value={arbitrationProvider}
            onChange={e => setArbitrationProvider(e.target.value)}
          />
        </div>
      ) : (
        <sl-checkbox
          value={termsAccepted}
          checked={termsAccepted}
          ref={checkBox}
        >
          {`I agree to ${getResolverString(arbitrationProvider)} `}
          <a
            target="_blank"
            href={
              arbitrationProvider === LEX_DAO
                ? 'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver'
                : 'https://anj.aragon.org/legal/terms-general.pdf'
            }
            rel="noreferrer noopener"
          >
            terms of service
          </a>
        </sl-checkbox>
      )}
    </section>
  );
};

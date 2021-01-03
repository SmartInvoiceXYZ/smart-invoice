import React, {useContext, useRef, useEffect} from 'react';
import {utils, BigNumber} from 'ethers';
import {dai_token, weth_token} from '../utils/Constants';
import {CreateContext} from '../context/CreateContext';

const PaymentDetailsForm = () => {
  const context = useContext(CreateContext);
  const {setTermsAccepted} = context;
  const checkBox = useRef(null);
  useEffect(() => {
    if (!checkBox.current) return;
    checkBox.current.addEventListener('sl-change', () =>
      setTermsAccepted(c => !c),
    );
  }, [checkBox, setTermsAccepted]);
  return (
    <section className="payment-details-form">
      <div className="ordered-inputs">
        <p className="tooltip">
          <sl-tooltip content="This will be the address used to access the invoice">
            <i className="far fa-question-circle"></i>
          </sl-tooltip>
        </p>
        <label>Client Address</label>
        <input
          type="text"
          value={context.clientAddress}
          onChange={e => context.setClientAddress(e.target.value)}
        />
      </div>
      <div className="ordered-inputs">
        <p className="tooltip">
          <sl-tooltip content="eg. Multisig, Gnosis safe">
            <i className="far fa-question-circle"></i>
          </sl-tooltip>
        </p>
        <label>Payment Address</label>
        <input
          type="text"
          value={context.paymentAddress}
          onChange={e => context.setPaymentAddress(e.target.value)}
        />
      </div>
      <div className="parallel-inputs">
        <div className="ordered-inputs">
          <label>Total Payment Due</label>
          <input
            type="number"
            onChange={e => {
              if (e.target.value && !isNaN(Number(e.target.value))) {
                context.setPaymentDue(utils.parseEther(e.target.value));
              } else {
                context.setPaymentDue(BigNumber.from(0));
              }
            }}
          />
        </div>
        <div className="ordered-inputs">
          <label>Payment Token</label>
          <select
            name="token"
            id="token"
            value={context.paymentToken}
            onChange={e => context.setPaymentToken(e.target.value)}
          >
            <option value={dai_token}>DAI</option>
            <option value={weth_token}>wETH</option>
          </select>
        </div>
        <div className="ordered-inputs">
          <p className="tooltip">
            <sl-tooltip content="Number of milestones in which the total payment will be processed">
              <i className="far fa-question-circle"></i>
            </sl-tooltip>
          </p>
          <label>Number of Payments</label>
          <input
            type="number"
            value={context.milestones}
            onChange={e => {
              const numMilestones = Number(e.target.value);
              context.setMilestones(numMilestones);
              const payments = Array(numMilestones)
                .fill(1)
                .map(() => {
                  return BigNumber.from(0);
                });
              context.setPayments(payments);
            }}
          />
        </div>
      </div>
      <div className="parallel-inputs">
        <div className="ordered-inputs">
          <p className="tooltip">
            <sl-tooltip content="Arbitration provider that will be used incase of a dispute">
              <i className="far fa-question-circle"></i>
            </sl-tooltip>
          </p>
          <label>Arbitration Provider</label>
          <select
            name="provider"
            id="provider"
            value={context.arbitrationProvider}
            onChange={e => context.setArbitrationProvider(e.target.value)}
          >
            <option value="Lex">Lex DAO</option>
            <option value="Aragon Court">Aragon Court</option>
          </select>
        </div>
        <div className="ordered-inputs">
          <p className="tooltip">
            <sl-tooltip content="The fee that is used to resolve the issue in case of a dispute">
              <i className="far fa-question-circle"></i>
            </sl-tooltip>
          </p>
          <label>Max Fee</label>
          <input type="text" disabled value={`${100} DAI`} />
        </div>
        <div className="ordered-inputs">
          {context.arbitrationProvider === 'Lex' ? (
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
      {context.arbitrationProvider === 'Lex' ? (
        <sl-checkbox
          value={context.termsAccepted}
          checked={context.termsAccepted}
          ref={checkBox}
        >
          I agree to LexDAO{' '}
          <a
            target="_blank"
            href="https://docs.google.com/document/d/1SoHrtoZbvgJg9OluZueZqoUracuEmvccWLo4EPU61R4/view"
            rel="noreferrer noopener"
          >
            terms of service
          </a>
        </sl-checkbox>
      ) : (
        <sl-checkbox
          value={context.termsAccepted}
          checked={context.termsAccepted}
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

export default PaymentDetailsForm;

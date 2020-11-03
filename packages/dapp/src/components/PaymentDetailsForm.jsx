import React from 'react';

const PaymentDetailsForm = ({ context }) => {
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
          onChange={e => context.setPaymentAddress(e.target.value)}
        />
      </div>
      <div className="parallel-inputs">
        <div className="ordered-inputs">
          <label>Total Payment Due</label>
          <input
            type="number"
            onChange={e => context.setPaymentDue(e.target.value)}
          />
        </div>
        <div className="ordered-inputs">
          <label>Payment Token</label>
          <select
            name="token"
            id="token"
            onChange={e => context.setPaymentToken(e.target.value)}
          >
            <option value="DAI">DAI</option>
            <option value="wETH">wETH</option>
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
            onChange={e => context.setMilestones(e.target.value)}
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
            onChange={e => context.setArbitrationProvider(e.target.value)}
          >
            <option value="Lex">Lex</option>
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
          <p id="arb-fee-desc">
            LexDAO deducts a 5% arbitration fee from remaining funds in the case
            of dispute
          </p>
        </div>
      </div>
      <sl-checkbox>
        I agree to LexDAO <a href="https://raidguild.org/">terms of service</a>
      </sl-checkbox>
    </section>
  );
};

export default PaymentDetailsForm;

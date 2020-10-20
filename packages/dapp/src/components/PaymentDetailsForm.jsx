import React from 'react';

import '../sass/formStyles.scss';

const PaymentDetailsForm = ({ context }) => {
    return (
        <section className='payment-details-form'>
            <div className='ordered-inputs'>
                <label>Client Address</label>
                <input type='text' onChange={(e) => context.setClientAddress(e.target.value)} />
            </div>
            <div className='ordered-inputs'>
                <label>Payment Address</label>
                <input type='text' onChange={(e) => context.setPaymentAddress(e.target.value)} />
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Total Payment Due</label>
                    <input type='number' onChange={(e) => context.setPaymentDue(e.target.value)} />
                </div>
                <div className='ordered-inputs'>
                    <label>Payment Token</label>
                    <select name="token" id="token" onChange={(e) => context.setPaymentToken(e.target.value)}>
                        <option value="DAI">DAI</option>
                        <option value="wETH">wETH</option>
                    </select>
                </div>
                <div className='ordered-inputs'>
                    <label>Number of Payments</label>
                    <input type='number' onChange={(e) => context.setMilestones(e.target.value)} />
                </div>
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Arbitration Provider</label>
                    <select name="provider" id="provider" onChange={(e) => context.setArbitrationProvider(e.target.value)}>
                        <option value="Lex">Lex</option>
                        <option value="Aragon Court">Aragon Court</option>
                    </select>
                </div>
            </div>
        </section>
    );
}

export default PaymentDetailsForm;
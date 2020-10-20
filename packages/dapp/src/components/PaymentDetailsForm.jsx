import React from 'react';

import '../sass/formStyles.scss';

const PaymentDetailsForm = () => {
    return (
        <section className='payment-details-form'>
            <div className='ordered-inputs'>
                <label>Client Address</label>
                <input type='text' />
            </div>
            <div className='ordered-inputs'>
                <label>Payment Address</label>
                <input type='text' />
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Total Payment Due</label>
                    <input type='text' />
                </div>
                <div className='ordered-inputs'>
                    <label>Payment Token</label>
                    <input type='text' />
                </div>
                <div className='ordered-inputs'>
                    <label>Number of Payments</label>
                    <input type='text' />
                </div>
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Arbitration Provider</label>
                    <input type='text' />
                </div>
                <div className='ordered-inputs'>
                    <label>Maximum Fee</label>
                    <input type='text' />
                </div>
            </div>
        </section>
    );
}

export default PaymentDetailsForm;
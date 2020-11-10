import React from 'react';
import { utils } from 'ethers';

const FormConfirmation = ({ context }) => {
    console.log(context.startDate)
    return (
        <section className='form-confirmation'>
            <p id='project-title'>{context.projectName}</p>
            <p>{context.projectDescription}</p>
            <a href={context.projectAgreement}>{context.projectAgreement}</a>
            <div>
                <p>Client Address:</p>
                <p>{context.clientAddress}</p>
            </div>
            <div>
                <p>Payment Address:</p>
                <p>{context.paymentAddress}</p>
            </div>
            <div>
                <p>Project Start Date:</p>
                <p>{context.startDate.toLocaleDateString()}</p>
            </div>
            <div>
                <p>Expected End Date:</p>
                <p>{context.endDate.toLocaleDateString()}</p>
            </div>
            <div>
                <p>Safety Valve Date:</p>
                <p>{context.safetyValveDate.toLocaleDateString()}</p>
            </div>
            <div>
                <p>Arbitration Provider:</p>
                <p>{context.arbitrationProvider}</p>
            </div>
            <hr></hr>
            <div className='total-payment-info'>
                <p>{context.milestones} Payments</p>
                <p>{utils.formatEther(context.paymentDue)} {context.paymentToken} Total</p>
            </div>
        </section>
    );
}

export default FormConfirmation;

import React, { useEffect, useContext, useState } from 'react';
import { withRouter } from 'react-router-dom';

import { AppContext } from '../context/AppContext';

import StepInfo from '../shared/StepInfo';
import ProjectDetailsForm from '../components/ProjectDetailsForm';
import PaymentDetailsForm from '../components/PaymentDetailsForm';
import PaymentChunksForm from '../components/PaymentChunksForm';

const { steps } = require('../utils/Constants');

const CreateInvoice = (props) => {
    const context = useContext(AppContext);
    const [currentStep, setStep] = useState(1)

    // useEffect(() => {
    //     if (context.address === '') return props.history.push('/')
    // }, [])

    return (
        <div className='create-invoice'>
            <StepInfo stepNum={currentStep} stepTitle={steps[currentStep].step_title} stepDetails={steps[currentStep].step_details} />
            <div>
                {currentStep === 1 && <ProjectDetailsForm />}
                {currentStep === 2 && <PaymentDetailsForm />}
                {currentStep === 3 && <PaymentChunksForm />}
                <div className='form-action-buttons'>
                    {currentStep !== 1 && <button id='back-button' onClick={() => setStep((prevState) => prevState - 1)}>BACK</button>}
                    <button id='next-button' onClick={() => setStep((prevState) => prevState + 1)}>NEXT: SET PAYMENT AMOUNTS</button>
                </div>
            </div>
        </div>
    );
}

export default withRouter(CreateInvoice);
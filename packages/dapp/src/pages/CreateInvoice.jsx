import React, { useEffect, useContext, useState } from 'react';
import { withRouter } from 'react-router-dom';

import { AppContext } from '../context/AppContext';

import StepInfo from '../shared/StepInfo';
import ProjectDetailsForm from '../components/ProjectDetailsForm';
import PaymentDetailsForm from '../components/PaymentDetailsForm';
import PaymentChunksForm from '../components/PaymentChunksForm';
import FormConfirmation from '../components/FormConfirmation';

const { steps } = require('../utils/Constants');

const CreateInvoice = (props) => {
    const context = useContext(AppContext);
    const [currentStep, setStep] = useState(1)

    useEffect(() => {
        if (context.address === '') return props.history.push('/')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const stepHandler = () => {
        if (currentStep === 4) return props.history.push('/invoice')
        setStep((prevState) => prevState + 1);
    }

    return (
        <div className='create-invoice'>
            <StepInfo stepNum={currentStep} stepTitle={steps[currentStep].step_title} stepDetails={steps[currentStep].step_details} />
            <div>
                {currentStep === 1 && <ProjectDetailsForm context={context} />}
                {currentStep === 2 && <PaymentDetailsForm context={context} />}
                {currentStep === 3 && <PaymentChunksForm context={context} />}
                {currentStep === 4 && <FormConfirmation context={context} />}
                <div className='form-action-buttons'>
                    {currentStep !== 1 && <button id='back-button' onClick={() => setStep((prevState) => prevState - 1)}>BACK</button>}
                    <button id='next-button' onClick={stepHandler}>next: {steps[currentStep].next}</button>
                </div>
            </div>
        </div>
    );
}

export default withRouter(CreateInvoice);
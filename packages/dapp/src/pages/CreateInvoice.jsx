import React, { useContext, useEffect, useState, useRef } from 'react';
import { withRouter } from 'react-router-dom';

import CreateContextProvider, { CreateContext } from '../context/CreateContext';

import StepInfo from '../shared/StepInfo';
import ProjectDetailsForm from '../components/ProjectDetailsForm';
import PaymentDetailsForm from '../components/PaymentDetailsForm';
import PaymentChunksForm from '../components/PaymentChunksForm';
import FormConfirmation from '../components/FormConfirmation';
import RegisterSuccess from '../components/RegisterSuccess';

import '../sass/createInvoiceStyles.scss';
import { utils, BigNumber } from 'ethers';
const { isAddress } = utils;

const { steps } = require('../utils/Constants');

const CreateInvoice = () => {
  const {
    tx,
    createInvoice,
    projectName,
    projectAgreement,
    clientAddress,
    paymentAddress,
    paymentToken,
    safetyValveDate,
    paymentDue,
    payments,
    termsAccepted,
  } = useContext(CreateContext);
  const [currentStep, setStep] = useState(1);
  const [isEnabled, setEnabled] = useState(false);
  const nextButton = useRef(null);

  useEffect(() => {
    if (
      currentStep === 1 &&
      projectName &&
      projectAgreement &&
      safetyValveDate
    ) {
      setEnabled(true);
      nextButton.current.classList.remove('disabled');
    } else if (
      currentStep === 2 &&
      isAddress(clientAddress) &&
      isAddress(paymentAddress) &&
      isAddress(paymentToken) &&
      paymentDue.gt(0) &&
      termsAccepted
    ) {
      setEnabled(true);
      nextButton.current.classList.remove('disabled');
    } else if (
      currentStep === 3 &&
      payments
        .reduce((t, a) => {
          return t.add(a);
        }, BigNumber.from(0))
        .eq(paymentDue)
    ) {
      setEnabled(true);
      nextButton.current.classList.remove('disabled');
    } else if (currentStep === 4) {
      setEnabled(true);
      nextButton.current.classList.remove('disabled');
    } else {
      setEnabled(false);
      nextButton.current.classList.add('disabled');
    }
  }, [
    projectName,
    projectAgreement,
    safetyValveDate,
    clientAddress,
    paymentAddress,
    paymentToken,
    paymentDue,
    payments,
    termsAccepted,
    currentStep,
  ]);

  const stepHandler = () => {
    if (!isEnabled) return;
    if (currentStep === 4) return createInvoice();
    setStep(prevState => prevState + 1);
  };

  if (tx) return <RegisterSuccess />;
  return (
    <div className="main overlay">
      <div className="create-invoice">
        <StepInfo
          stepNum={currentStep}
          stepTitle={steps[currentStep].step_title}
          stepDetails={steps[currentStep].step_details}
        />
        <div>
          {currentStep === 1 && <ProjectDetailsForm />}
          {currentStep === 2 && <PaymentDetailsForm />}
          {currentStep === 3 && <PaymentChunksForm />}
          {currentStep === 4 && <FormConfirmation />}
          <div className="form-action-buttons">
            {currentStep !== 1 && (
              <button
                id="back-button"
                onClick={() => setStep(prevState => prevState - 1)}
              >
                BACK
              </button>
            )}
            <button id="next-button" onClick={stepHandler} ref={nextButton}>
              next: {steps[currentStep].next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateInvoiceWithProvider = props => (
  <CreateContextProvider>
    <CreateInvoice {...props} />
  </CreateContextProvider>
);

export default withRouter(CreateInvoiceWithProvider);

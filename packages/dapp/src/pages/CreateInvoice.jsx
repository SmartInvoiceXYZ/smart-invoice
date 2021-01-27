import '../sass/createInvoiceStyles.scss';

import { BigNumber, utils } from 'ethers';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { withRouter } from 'react-router-dom';

import { FormConfirmation } from '../components/FormConfirmation';
import { PaymentChunksForm } from '../components/PaymentChunksForm';
import { PaymentDetailsForm } from '../components/PaymentDetailsForm';
import { ProjectDetailsForm } from '../components/ProjectDetailsForm';
import { RegisterSuccess } from '../components/RegisterSuccess';
import { CreateContext, CreateContextProvider } from '../context/CreateContext';
import { StepInfo } from '../shared/StepInfo';
import { STEPS } from '../utils/constants';

const { isAddress } = utils;

const CreateInvoiceInner = () => {
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
    arbitrationProvider,
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
      isAddress(arbitrationProvider) &&
      paymentDue.gt(0) &&
      termsAccepted &&
      Array.from(
        new Set([
          clientAddress.toLowerCase(),
          paymentAddress.toLowerCase(),
          paymentToken.toLowerCase(),
          arbitrationProvider.toLowerCase(),
        ]),
      ).length === 4
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
    arbitrationProvider,
  ]);

  const stepHandler = () => {
    if (isEnabled) {
      if (currentStep === 4) return createInvoice();
      setStep(prevState => prevState + 1);
    }
    return () => undefined;
  };

  return (
    <div className="main overlay">
      {tx ? (
        <RegisterSuccess />
      ) : (
        <div className="create-invoice">
          <StepInfo
            stepNum={currentStep}
            stepTitle={STEPS[currentStep].step_title}
            stepDetails={STEPS[currentStep].step_details}
          />
          <div>
            {currentStep === 1 && <ProjectDetailsForm />}
            {currentStep === 2 && <PaymentDetailsForm />}
            {currentStep === 3 && <PaymentChunksForm />}
            {currentStep === 4 && <FormConfirmation />}
            <div className="form-action-buttons">
              {currentStep !== 1 && (
                <button
                  type="button"
                  id="back-button"
                  onClick={() => setStep(prevState => prevState - 1)}
                >
                  BACK
                </button>
              )}
              <button
                type="button"
                id="next-button"
                onClick={stepHandler}
                ref={nextButton}
              >
                next: {STEPS[currentStep].next}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateInvoiceWithProvider = props => (
  <CreateContextProvider>
    <CreateInvoiceInner {...props} />
  </CreateContextProvider>
);

export const CreateInvoice = withRouter(CreateInvoiceWithProvider);

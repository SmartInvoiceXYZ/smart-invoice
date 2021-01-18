import React from 'react';

export const StepInfo = ({ stepNum, stepTitle, stepDetails }) => {
  return (
    <section className="invoice-step-details">
      <p className="section-title">Create a Smart Invoice</p>
      <p className="step-title">
        Step {stepNum}: {stepTitle}
      </p>
      {stepDetails.map((detail, index) => {
        return (
          <p className="step-details" key={index.toString()}>
            {detail}
          </p>
        );
      })}
    </section>
  );
};

import React, { useContext } from 'react';

import { CreateContext } from '../context/CreateContext';

export const ProjectDetailsForm = () => {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    safetyValveDate,
    setSafetyValveDate,
    projectName,
    setProjectName,
    projectDescription,
    setProjectDescription,
    projectAgreement,
    setProjectAgreement,
  } = useContext(CreateContext);
  return (
    <section className="project-details-form">
      <div className="ordered-inputs">
        <label>Project Name or ID</label>
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
        />
      </div>
      <div className="ordered-inputs">
        <p className="tooltip">140 character limit - optional</p>
        <label>Project Description</label>
        <input
          type="text"
          value={projectDescription}
          onChange={e => setProjectDescription(e.target.value)}
        />
      </div>
      <div className="ordered-inputs">
        <p className="tooltip">
          <sl-tooltip content="This agreement will be referenced in the case of a dispute">
            <i className="far fa-question-circle" />
          </sl-tooltip>
        </p>
        <label>Link to Project Agreement</label>
        <input
          type="text"
          value={projectAgreement}
          onChange={e => setProjectAgreement(e.target.value)}
        />
      </div>
      <div className="parallel-inputs">
        <div className="ordered-inputs">
          <p className="tooltip">optional</p>
          <label>Project Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="ordered-inputs">
          <p className="tooltip">optional</p>
          <label>Expected End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <div className="ordered-inputs">
          <p className="tooltip">
            <sl-tooltip content="The date at which funds cannot be moved">
              <i className="far fa-question-circle" />
            </sl-tooltip>
          </p>
          <label>Safety Valve Date</label>
          <input
            type="date"
            value={safetyValveDate}
            onChange={e => setSafetyValveDate(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
};

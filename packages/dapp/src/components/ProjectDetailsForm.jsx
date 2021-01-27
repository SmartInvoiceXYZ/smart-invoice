import React, { useContext } from 'react';

import { CreateContext } from '../context/CreateContext';

const formatDate = date => {
  const d = new Date(date);

  let month = '' + (d.getMonth() + 1);
  if (month.length < 2) month = '0' + month;

  let day = '' + d.getDate();
  if (day.length < 2) day = '0' + day;

  const year = d.getFullYear();

  return [year, month, day].join('-');
};

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

  const startDateString = startDate ? formatDate(startDate) : '';
  const endDateString = endDate ? formatDate(endDate) : '';
  const safetyValveDateString = safetyValveDate
    ? formatDate(safetyValveDate)
    : '';

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
            value={startDateString}
            onChange={e => setStartDate(Date.parse(e.target.value))}
          />
        </div>
        <div className="ordered-inputs">
          <p className="tooltip">optional</p>
          <label>Expected End Date</label>
          <input
            type="date"
            value={endDateString}
            onChange={e => setEndDate(Date.parse(e.target.value))}
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
            value={safetyValveDateString}
            onChange={e => setSafetyValveDate(Date.parse(e.target.value))}
          />
        </div>
      </div>
    </section>
  );
};

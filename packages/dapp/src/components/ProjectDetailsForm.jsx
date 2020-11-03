import React from 'react';
import DayPickerInput from 'react-day-picker/DayPickerInput';

import 'react-day-picker/lib/style.css';

const ProjectDetailsForm = ({ context }) => {

    return (
        <section className='project-details-form'>
            <div className='ordered-inputs'>
                <label>Project Name or ID</label>
                <input type='text' onChange={(e) => context.setProjectName(e.target.value)} />
            </div>
            <div className='ordered-inputs'>
                <p className='tooltip'>140 character limit - optional</p>
                <label>Project Description</label>
                <input type='text' onChange={(e) => context.setProjectDescription(e.target.value)} />
            </div>
            <div className='ordered-inputs'>
                <p className='tooltip'>
                    <sl-tooltip content="This agreement will be referenced in the case of a dispute">
                        <i className="far fa-question-circle"></i>
                    </sl-tooltip>
                </p>
                <label>Link to Project Agreement</label>
                <input type='text' onChange={(e) => context.setProjectAgreement(e.target.value)} />
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <p className='tooltip'>optional</p>
                    <label>Project Start Date</label>
                    <DayPickerInput onDayChange={(e) => context.setStartDate(e.toLocaleDateString())} />
                </div>
                <div className='ordered-inputs'>
                    <p className='tooltip'>optional</p>
                    <label>Expected End Date</label>
                    <DayPickerInput onDayChange={(e) => context.setEndDate(e.toLocaleDateString())} />
                </div>
                <div className='ordered-inputs'>
                    <p className='tooltip'>
                        <sl-tooltip content="The date at which funds cannot be moved">
                            <i className="far fa-question-circle"></i>
                        </sl-tooltip>
                    </p>
                    <label>Safety Valve Date</label>
                    <DayPickerInput onDayChange={(e) => context.setSafetyValveDate(e.toLocaleDateString())} />
                </div>
            </div>
        </section>
    );
}

export default ProjectDetailsForm;
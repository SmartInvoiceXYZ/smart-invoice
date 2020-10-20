import React, { useState } from 'react';
import DayPickerInput from 'react-day-picker/DayPickerInput';

import 'react-day-picker/lib/style.css';

import '../sass/formStyles.scss';

const ProjectDetailsForm = ({ context }) => {

    return (
        <section className='project-details-form'>
            <div className='ordered-inputs'>
                <label>Project Name or ID</label>
                <input type='text' onChange={(e) => context.setProjectName(e.target.value)} />
            </div>
            <div className='ordered-inputs'>
                <label>Project Description</label>
                <input type='text' onChange={(e) => context.setProjectDescription(e.target.value)} />
            </div>
            <div className='ordered-inputs'>
                <label>Link to Project Agreement</label>
                <input type='text' onChange={(e) => context.setProjectAgreement(e.target.value)} />
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Project Start Date</label>
                    <DayPickerInput onDayChange={(e) => context.setStartDate(e.toLocaleDateString())} />
                </div>
                <div className='ordered-inputs'>
                    <label>Expected End Date</label>
                    <DayPickerInput onDayChange={(e) => context.setEndDate(e.toLocaleDateString())} />
                </div>
                <div className='ordered-inputs'>
                    <label>Safety Valve Date</label>
                    <DayPickerInput onDayChange={(e) => context.setSafetyValveDate(e.toLocaleDateString())} />
                </div>
            </div>
        </section>
    );
}

export default ProjectDetailsForm;
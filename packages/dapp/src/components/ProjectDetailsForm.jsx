import React from 'react';

import '../sass/formStyles.scss';

const ProjectDetailsForm = () => {
    return (
        <section className='project-details-form'>
            <div className='ordered-inputs'>
                <label>Project Name or ID</label>
                <input type='text' id='project-name' />
            </div>
            <div className='ordered-inputs'>
                <label>Project Description</label>
                <input type='text' id='project-desc' />
            </div>
            <div className='ordered-inputs'>
                <label>Link to Project Agreement</label>
                <input type='text' id='project-agreement' />
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Project Start Date</label>
                    <input type='text' id='project-start-date' />
                </div>
                <div className='ordered-inputs'>
                    <label>Expected End Date</label>
                    <input type='text' id='project-end-date' />
                </div>
                <div className='ordered-inputs'>
                    <label>Safety Valve Date</label>
                    <input type='text' id='safety-valve-date' />
                </div>
            </div>
        </section>
    );
}

export default ProjectDetailsForm;
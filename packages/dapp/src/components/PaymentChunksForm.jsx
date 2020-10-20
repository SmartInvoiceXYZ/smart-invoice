import React from 'react';

const ProjectChunksForm = () => {
    return (
        <section className='payment-chunks-form'>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Payment 1</label>
                    <input type='text' />
                </div>
                <sl-switch className="slider"></sl-switch>
                <div className='ordered-inputs'>
                    <label>Percentage</label>
                    <input type='text' />
                </div>
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Payment 2</label>
                    <input type='text' />
                </div>
                <sl-switch></sl-switch>
                <div className='ordered-inputs'>
                    <label>Percentage</label>
                    <input type='text' />
                </div>
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Payment 3</label>
                    <input type='text' />
                </div>
                <sl-switch></sl-switch>
                <div className='ordered-inputs'>
                    <label>Percentage</label>
                    <input type='text' />
                </div>
            </div>
            <div className='parallel-inputs'>
                <div className='ordered-inputs'>
                    <label>Payment 4</label>
                    <input type='text' />
                </div>
                <sl-switch></sl-switch>
                <div className='ordered-inputs'>
                    <label>Percentage</label>
                    <input type='text' />
                </div>
            </div>
        </section>
    );
}

export default ProjectChunksForm;
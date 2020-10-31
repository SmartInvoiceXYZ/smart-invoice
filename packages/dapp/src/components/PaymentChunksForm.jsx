import React from 'react';

const ProjectChunksForm = ({ context }) => {

    return (
        <section className='payment-chunks-form'>
            {Array.from(Array(Number(context.milestones))).map((i, index) => {
                return (
                    <div className='parallel-inputs' key={index}>
                        <div className='ordered-inputs'>
                            <label>Payment {i}</label>
                            <input type='text' />
                        </div>
                        <sl-switch className="slider"></sl-switch>
                        <div className='ordered-inputs'>
                            <label>Percentage</label>
                            <input type='text' />
                        </div>
                    </div>
                )
            })}
        </section>
    );
}

export default ProjectChunksForm;
import React, { useContext, useState } from 'react';
import { withRouter } from 'react-router-dom';

import { AppContext } from '../context/AppContext';

import '../sass/homeStyles.scss';

import RaidCastle from '../assets/raid__cloud__castle.png'

const Home = (props) => {
    const context = useContext(AppContext);
    const [invoiceSwitch, setInvoiceSwitch] = useState(false)
    const [invoiceId, setInvoiceId] = useState('')

    const connect = async () => {
        await context.connectAccount()
        if (context.address === '') return;
        if (invoiceSwitch) return props.history.push(`/invoice/${invoiceId}`)
        props.history.push('/create-invoice')
    }

    return (
        <div className='home'>
            <img src={RaidCastle} id="raid-castle" alt='raid-castle' />
            {!invoiceSwitch ? 
                <div>
                    <button className='bg-red' onClick={connect}>CREATE A NEW SMART INVOICE</button>
                    <p>or</p>
                    <button className='bg-red' onClick={() => setInvoiceSwitch(true)}>VIEW EXISTING INVOICE</button>
                </div> : 
                <div>
                    <input type='text' placeholder='Enter Invoice ID' onChange={(e) => setInvoiceId(e.target.value)}></input>
                    <button className='bg-red' onClick={connect}>VALIDATE ID</button>
                </div>
            } 
        </div>
    );
}

export default withRouter(Home);
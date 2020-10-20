import React, { useContext } from 'react';
import { withRouter } from 'react-router-dom';

import { AppContext } from '../context/AppContext';

import RaidCastle from '../assets/raid__cloud__castle.png'

const Home = (props) => {
    const context = useContext(AppContext);

    const connect = async () => {
        await context.connectAccount()
        if (context.address === '') return;
        props.history.push('/create-invoice')
    }

    return (
        <div className='home'>
            <img src={RaidCastle} id="raid-castle" alt='raid-castle' />
            <div>
                <button className='bg-red' onClick={connect}>CREATE A NEW SMART INVOICE</button>
                <p>or</p>
                <button className='bg-red' onClick={connect}>VIEW EXISTING INVOICE</button>
            </div>
        </div>
    );
}

export default withRouter(Home);
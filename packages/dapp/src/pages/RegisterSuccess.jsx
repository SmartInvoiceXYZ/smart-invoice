import React, { useContext } from 'react';
import { withRouter } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

import '../sass/registerSuccessStyles.scss';

const RegisterSuccess = (props) => {
  const { txHash } = useContext(AppContext);
    return (
        <div className='register-success'>
            <p id="title">Invoice Registration Received</p>
            <p id='transaction-text'>You can check the progress of your transaction <a href={`https://rinkeby.etherscan.io/tx/${txHash}`}>here</a>.</p>
            <p id='info-text'>Save these details because you will need it to manage your invoice later:</p>
            <div>
                <label>Your Invoice ID</label>
                <p>projectID</p>
            </div>
            <div>
                <label>Link to Invoice</label>
                <p>https://etherscan.io/</p>
            </div>
            <button id="return-home-button" onClick={() => props.history.push('/')}>Return Home</button>
        </div>
    );
}

export default withRouter(RegisterSuccess);

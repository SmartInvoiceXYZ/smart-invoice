import '../sass/connectStyles.scss';

import React, { useContext } from 'react';

import { Web3Context } from '../context/Web3Context';
import { NETWORK_NAME, NETWORK } from '../utils/constants';

export const ConnectWeb3 = () => {
  const { chainId, loading, disconnect } = useContext(Web3Context);

  return (
    <div className="main">
      {!loading && (
        <div className="connect">
          <p> Unsupported network - {chainId} </p>
          <p>
            Please connect to {NETWORK_NAME} - {NETWORK}
          </p>

          <button className="bg-red" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

import { BigNumber } from 'ethers';
import { useContext, useEffect, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { balanceOf } from '../utils/erc20';
import { logError } from '../utils/helpers';

export const useInvoiceStatus = invoice => {
  const { provider } = useContext(Web3Context);

  const [loading, setLoading] = useState(true);
  const [funded, setFunded] = useState(false);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (invoice && provider) {
      const {
        currentMilestone,
        amounts,
        token,
        address,
        isLocked,
        terminationTime,
        disputes,
        resolutions,
      } = invoice;
      balanceOf(provider, token, address)
        .then(balance => {
          if (Number(currentMilestone) === amounts.length) {
            if (
              disputes.length === resolutions.length &&
              resolutions.length > 0
            ) {
              setLabel('Dispute Resolved');
            } else {
              setLabel('Completed');
            }
          } else {
            const amount = BigNumber.from(amounts[currentMilestone]);
            if (balance.gte(amount)) {
              setFunded(!isLocked);
              setLabel('Funded');
            } else {
              setLabel('Awaiting Deposit');
            }
            if (isLocked) {
              setLabel('In Dispute');
            } else if (terminationTime <= new Date().getTime() / 1000) {
              setLabel('Expired');
            }
          }

          setLoading(false);
        })
        .catch(statusError => logError({ statusError }));
    }
  }, [invoice, provider]);

  return { funded, label, loading };
};

import { BigNumber } from 'ethers';
import { useContext, useEffect, useState } from 'react';

import { Web3Context } from '../context/Web3Context';
import { balanceOf } from '../utils/erc20';
import { logError } from '../utils/helpers';
import { getDeadline, getTotalFulfilled } from '../utils/invoice';

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
        deposits,
        invoiceType,
      } = invoice;
      if (invoiceType === 'escrow') {
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
              if (deposits.length > 0 && balance < amount) {
                setFunded(!isLocked);
                setLabel('Partially Funded');
              } else if (balance.gte(amount)) {
                setFunded(!isLocked);
                setLabel('Funded');
              } else if (terminationTime <= new Date().getTime() / 1000) {
                setLabel('Expired');
              } else {
                setLabel('Awaiting Deposit');
              }
              if (isLocked) {
                setLabel('In Dispute');
              }
            }

            setLoading(false);
          })
          .catch(statusError => logError({ statusError }));
      } else {
        fetchInstantInfo(provider, address)
          .then(info => {
            if (info.isFulfilled) {
              setFunded(true);
              setLabel('Completed');
            } else if (deposits.length > 0) {
              setFunded(true);
              setLabel('Partially Funded');
            } else if (info.deadline <= new Date().getTime() / 1000) {
              setLabel('Overdue');
            } else {
              setLabel('Awaiting Deposit');
            }

            setLoading(false);
          })
          .catch(statusError => logError({ statusError }));
      }
    }
  }, [invoice, provider]);

  async function fetchInstantInfo(provider, invoiceAddress) {
    try {
      const deadline = await getDeadline(provider, invoiceAddress);
      const fulfilled = await getTotalFulfilled(provider, invoiceAddress);
      return {
        deadline,
        isFulfilled: fulfilled.isFulfilled,
        fulfilledAmount: fulfilled.amount,
      };
    } catch (instantFetchError) {
      logError({ instantFetchError });
    }
  }

  return { funded, label, loading };
};

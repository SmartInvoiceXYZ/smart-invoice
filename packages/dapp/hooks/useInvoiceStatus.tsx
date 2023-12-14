// @ts-expect-error TS(2792): Cannot find module 'ethers'. Did you mean to set t... Remove this comment to see the full error message
import { bigint } from 'ethers';
// @ts-expect-error TS(2792): Cannot find module 'react'. Did you mean to set th... Remove this comment to see the full error message
import { useContext, useEffect, useState } from 'react';

import { balanceOf } from '../utils/erc20';
import { logError } from '../utils/helpers';
import { getDeadline, getTotalFulfilled } from '../utils/invoice';

// @ts-expect-error TS(6142): Module '../context/Web3Context' was resolved to '/... Remove this comment to see the full error message


export const useInvoiceStatus = (invoice: any) => {
  const { provider } = useWalletClient();

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
              const amount = BigInt(amounts[currentMilestone]);
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
            // @ts-expect-error TS(2532): Object is possibly 'undefined'.
            if (info.isFulfilled) {
              setFunded(true);
              setLabel('Completed');
            } else if (deposits.length > 0) {
              setFunded(true);
              setLabel('Partially Funded');
              // @ts-expect-error TS(2532): Object is possibly 'undefined'.
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

  async function fetchInstantInfo(provider: any, invoiceAddress: any) {
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

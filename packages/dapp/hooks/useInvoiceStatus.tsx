import { useEffect, useState } from 'react';

import { balanceOf } from '../utils/erc20';
import { logError } from '../utils/helpers';
import { getDeadline, getTotalFulfilled } from '../utils/invoice';
import { useWalletClient } from 'wagmi';

export const useInvoiceStatus = (invoice: any) => {
  const { data: walletClient } = useWalletClient();

  const [loading, setLoading] = useState(true);
  const [funded, setFunded] = useState(false);
  const [label, setLabel] = useState('');

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
      return undefined;
    }
  }

  useEffect(() => {
    if (invoice && walletClient) {
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
        balanceOf(walletClient.chain, token, address)
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
              } else if (balance >= amount) {
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
        fetchInstantInfo(walletClient.chain, address)
          .then(info => {
            if (info?.isFulfilled) {
              setFunded(true);
              setLabel('Completed');
            } else if (deposits.length > 0) {
              setFunded(true);
              setLabel('Partially Funded');
            } else if (
              info?.deadline &&
              info?.deadline <= new Date().getTime() / 1000
            ) {
              setLabel('Overdue');
            } else {
              setLabel('Awaiting Deposit');
            }

            setLoading(false);
          })
          .catch(statusError => logError({ statusError }));
      }
    }
  }, [invoice, walletClient]);

  return { funded, label, loading };
};

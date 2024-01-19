import { Invoice } from '@smart-invoice/graphql';
import {
  balanceOf,
  getDeadline,
  getTotalFulfilled,
  isAddress,
  logError,
} from '@smart-invoice/utils';
import { useEffect, useState } from 'react';
import { Address, Chain, useNetwork } from 'wagmi';

export const useInvoiceStatus = (invoice: Invoice) => {
  const { chain } = useNetwork();

  const [loading, setLoading] = useState(true);
  const [funded, setFunded] = useState(false);
  const [label, setLabel] = useState('');

  async function fetchInstantInfo(_chain: Chain, invoiceAddress: Address) {
    try {
      // const deadline = await getDeadline(_chain, invoiceAddress);
      // const fulfilled = await getTotalFulfilled(_chain, invoiceAddress);
      return {
        deadline: 10,
        isFulfilled: true, // fulfilled.isFulfilled,
        fulfilledAmount: 10, // fulfilled.amount,
      };
    } catch (instantFetchError) {
      logError({ instantFetchError });
      return undefined;
    }
  }

  useEffect(() => {
    if (invoice && chain) {
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
      const validAddress = isAddress(address);
      const validToken = isAddress(token);
      if (!validAddress) return;
      if (validAddress && validToken && invoiceType === 'escrow') {
        // balanceOf(chain, validToken, validAddress)
        //   .then(balance => {
        //     if (Number(currentMilestone) === amounts.length) {
        //       if (
        //         disputes.length === resolutions.length &&
        //         resolutions.length > 0
        //       ) {
        //         setLabel('Dispute Resolved');
        //       } else {
        //         setLabel('Completed');
        //       }
        //     } else {
        //       const amount = BigInt(amounts[Number(currentMilestone)]);
        //       if (deposits.length > 0 && balance < amount) {
        //         setFunded(!isLocked);
        //         setLabel('Partially Funded');
        //       } else if (balance >= amount) {
        //         setFunded(!isLocked);
        //         setLabel('Funded');
        //       } else if (terminationTime <= new Date().getTime() / 1000) {
        //         setLabel('Expired');
        //       } else {
        //         setLabel('Awaiting Deposit');
        //       }
        //       if (isLocked) {
        //         setLabel('In Dispute');
        //       }
        //     }
        //     setLoading(false);
        //   })
        //   .catch(statusError => logError({ statusError }));
      } else {
        fetchInstantInfo(chain, validAddress)
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
  }, [invoice, chain]);

  return { funded, label, loading };
};

import { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../context/Web3Context';
import { balanceOf } from '../utils/erc20';
import { BigNumber } from 'ethers';

export const useInvoiceStatus = invoice => {
  const { provider } = useContext(Web3Context);

  const [loading, setLoading] = useState(true);
  const [funded, setFunded] = useState(false);
  const [label, setLabel] = useState('');

  useEffect(() => {
    console.log(invoice);
    if (invoice && provider) {
      const {
        currentMilestone,
        amounts,
        token,
        address,
        isLocked,
        terminationTime,
      } = invoice;
      balanceOf(provider, token, address)
        .then(balance => {
          const amount = BigNumber.from(amounts[currentMilestone]);
          if (balance.gte(amount)) {
            setFunded(!isLocked);
            setLabel('Funded');
          } else {
            setLabel('Awaiting Deposit');
          }
          if (isLocked) {
            setLabel('Locked');
          } else if (terminationTime <= new Date().getTime() / 1000) {
            setLabel('Expired');
          }

          setLoading(false);
        })
        // eslint-disable-next-line no-console
        .catch(balanceError => console.error({ balanceError }));
    }
  }, [invoice, provider]);

  return { funded, label, loading };
};

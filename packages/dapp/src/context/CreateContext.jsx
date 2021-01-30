import { BigNumber } from 'ethers';
import React, { createContext, useContext, useState } from 'react';

import { ADDRESSES } from '../utils/constants';
import { logError } from '../utils/helpers';
import { register } from '../utils/invoice';
import { uploadMetadata } from '../utils/ipfs';
import { Web3Context } from './Web3Context';

const { ARAGON_COURT, LEX_DAO, WRAPPED_TOKEN } = ADDRESSES;

export const CreateContext = createContext();

export const CreateContextProvider = ({ children }) => {
  const { provider } = useContext(Web3Context);

  // project details value
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectAgreement, setProjectAgreement] = useState('');
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [safetyValveDate, setSafetyValveDate] = useState();
  // payment details value
  const [clientAddress, setClientAddress] = useState('');
  const [paymentAddress, setPaymentAddress] = useState('');
  const [paymentDue, setPaymentDue] = useState(BigNumber.from(0));
  const [paymentToken, setPaymentToken] = useState(WRAPPED_TOKEN);
  const [milestones, setMilestones] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [arbitrationProvider, setArbitrationProvider] = useState(LEX_DAO);

  const [payments, setPayments] = useState([]);
  const [tx, setTx] = useState();
  const [loading, setLoading] = useState(false);

  const validate = () => {
    // TODO: validate all data here
    // ex check if dates are after now, safetyValveDate > endDate, etc
    const paymentsTotal = payments.reduce((t, a) => {
      return t.add(a);
    }, BigNumber.from(0));
    const isPaymentsValid = paymentsTotal.eq(paymentDue);
    return projectName && isPaymentsValid;
  };

  const createInvoice = async () => {
    setLoading(true);
    setTx();
    if (!validate()) throw new Error('validation error');

    const detailsHash = await uploadMetadata({
      projectName,
      projectDescription,
      projectAgreement,
      startDate: Math.floor(startDate / 1000),
      endDate: Math.floor(endDate / 1000),
    }).catch(ipfsError => {
      logError({ ipfsError });
      throw ipfsError;
    });

    const transaction = await register(
      provider,
      clientAddress,
      paymentAddress,
      arbitrationProvider === ARAGON_COURT ? 1 : 0,
      arbitrationProvider,
      paymentToken,
      payments,
      Math.floor(safetyValveDate / 1000),
      detailsHash,
    ).catch(registerError => {
      logError({ registerError });
      throw registerError;
    });

    setTx(transaction);
    setLoading(false);
  };

  return (
    <CreateContext.Provider
      value={{
        projectName,
        projectDescription,
        projectAgreement,
        startDate,
        endDate,
        safetyValveDate,
        clientAddress,
        paymentAddress,
        paymentDue,
        paymentToken,
        milestones,
        termsAccepted,
        arbitrationProvider,
        payments,
        tx,
        loading,
        // functions
        setProjectName,
        setProjectDescription,
        setProjectAgreement,
        setStartDate,
        setEndDate,
        setSafetyValveDate,
        setClientAddress,
        setPaymentAddress,
        setPaymentDue,
        setPaymentToken,
        setMilestones,
        setTermsAccepted,
        setArbitrationProvider,
        setPayments,
        createInvoice,
      }}
    >
      {children}
    </CreateContext.Provider>
  );
};

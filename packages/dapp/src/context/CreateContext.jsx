import { BigNumber } from 'ethers';
import React, { createContext, useContext, useState } from 'react';

import {
  getResolvers,
  getWrappedNativeToken,
  logError,
} from '../utils/helpers';
import { register } from '../utils/invoice';
import { uploadMetadata } from '../utils/ipfs';
import { Web3Context } from './Web3Context';

export const CreateContext = createContext();

export const CreateContextProvider = ({ children }) => {
  const { provider, chainId } = useContext(Web3Context);
  const RESOLVERS = getResolvers(chainId);
  const WRAPPED_NATIVE_TOKEN = getWrappedNativeToken(chainId);

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
  const [paymentToken, setPaymentToken] = useState(WRAPPED_NATIVE_TOKEN);
  const [milestones, setMilestones] = useState('1');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [arbitrationProvider, setArbitrationProvider] = useState(RESOLVERS[0]);

  const [payments, setPayments] = useState([BigNumber.from(0)]);
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
      setLoading(false);
      throw ipfsError;
    });

    const transaction = await register(
      chainId,
      provider,
      clientAddress,
      paymentAddress,
      arbitrationProvider,
      paymentToken,
      payments,
      Math.floor(safetyValveDate / 1000),
      detailsHash,
    ).catch(registerError => {
      logError({ registerError });
      setLoading(false);
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

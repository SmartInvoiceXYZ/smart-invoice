/* eslint-disable no-unused-vars */
import React, {createContext, useState, useContext} from 'react';

import {uploadMetadata} from '../utils/Ipfs';
import {register} from '../utils/Invoice';
import {lex_dao, aragon_court, dai_token} from '../utils/Constants';
import {BigNumber} from 'ethers';
import {AppContext} from './AppContext';

export const CreateContext = createContext();

const CreateContextProvider = props => {
  const {provider} = useContext(AppContext);

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
  const [paymentToken, setPaymentToken] = useState(dai_token);
  const [milestones, setMilestones] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [arbitrationProvider, setArbitrationProvider] = useState(
    'Aragon Court',
  );

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
    });

    const tx = await register(
      provider,
      clientAddress,
      paymentAddress,
      arbitrationProvider === 'Aragon Court' ? 1 : 0,
      arbitrationProvider === 'Aragon Court' ? aragon_court : lex_dao,
      paymentToken,
      payments,
      Math.floor(safetyValveDate / 1000),
      detailsHash,
    );

    setTx(tx);
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
      {props.children}
    </CreateContext.Provider>
  );
};

export default CreateContextProvider;

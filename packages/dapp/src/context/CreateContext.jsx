import { BigNumber, utils } from 'ethers';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getResolvers,
  getWrappedNativeToken,
  isValidLink,
  logError,
} from '../utils/helpers';
import { register } from '../utils/invoice';
import { uploadMetadata } from '../utils/ipfs';
import { Web3Context } from './Web3Context';

const { isAddress } = utils;

export const CreateContext = createContext();

export const CreateContextProvider = ({ children }) => {
  const { provider, chainId } = useContext(Web3Context);
  const RESOLVERS = getResolvers(chainId);
  const WRAPPED_NATIVE_TOKEN = getWrappedNativeToken(chainId);

  // project details
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectAgreement, setProjectAgreement] = useState({
    type: '',
    src: '',
  });
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [safetyValveDate, setSafetyValveDate] = useState();
  const [detailsHash, setDetailsHash] = useState(''); // ipfsHash for projectDetails

  // payment details
  const [clientAddress, setClientAddress] = useState('');
  const [paymentAddress, setPaymentAddress] = useState('');
  const [paymentDue, setPaymentDue] = useState(BigNumber.from(0));
  const [paymentToken, setPaymentToken] = useState(WRAPPED_NATIVE_TOKEN);
  const [milestones, setMilestones] = useState('1');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [arbitrationProvider, setArbitrationProvider] = useState(RESOLVERS[0]);
  const [requireVerificaiton, setRequireVerification] = useState(true);

  // payments chunks
  const [payments, setPayments] = useState([BigNumber.from(0)]);
  const [tx, setTx] = useState();
  const [loading, setLoading] = useState(false);

  // step handling
  const [currentStep, setStep] = useState(1);
  const [nextStepEnabled, setNextStepEnabled] = useState(false);

  const step1Valid = useMemo(
    () =>
      projectName &&
      isValidLink(projectAgreement) &&
      safetyValveDate &&
      safetyValveDate > new Date().getTime(),
    [projectName, projectAgreement, safetyValveDate],
  );

  const step2Valid = useMemo(
    () =>
      isAddress(clientAddress) &&
      isAddress(paymentAddress) &&
      isAddress(paymentToken) &&
      isAddress(arbitrationProvider) &&
      paymentDue.gt(0) &&
      !isNaN(Number(milestones)) &&
      milestones > 0 &&
      termsAccepted &&
      Array.from(
        new Set([
          clientAddress.toLowerCase(),
          paymentAddress.toLowerCase(),
          paymentToken.toLowerCase(),
          arbitrationProvider.toLowerCase(),
        ]),
      ).length === 4,
    [
      clientAddress,
      paymentAddress,
      paymentToken,
      arbitrationProvider,
      paymentDue,
      milestones,
      termsAccepted,
    ],
  );

  const step3Valid = useMemo(
    () => payments.reduce((t, a) => t.add(a), BigNumber.from(0)).eq(paymentDue),
    [payments, paymentDue],
  );

  useEffect(() => {
    if (step1Valid && currentStep === 2) {
      uploadMetadata({
        projectName,
        projectDescription,
        projectAgreement,
        startDate: Math.floor(startDate / 1000),
        endDate: Math.floor(endDate / 1000),
      })
        .catch(ipfsError => {
          logError({ ipfsError });
        })
        .then(hash => setDetailsHash(hash));
    }
  }, [
    step1Valid,
    currentStep,
    projectName,
    projectDescription,
    projectAgreement,
    startDate,
    endDate,
  ]);

  const createInvoice = useCallback(async () => {
    if (step1Valid && step2Valid && step3Valid && detailsHash) {
      setLoading(true);
      setTx();

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
        requireVerificaiton,
      ).catch(registerError => {
        logError({ registerError });
        setLoading(false);
        throw registerError;
      });

      setTx(transaction);
      setLoading(false);
    }
  }, [
    chainId,
    provider,
    clientAddress,
    paymentAddress,
    arbitrationProvider,
    paymentToken,
    payments,
    safetyValveDate,
    detailsHash,
    requireVerificaiton,
    step1Valid,
    step2Valid,
    step3Valid,
  ]);

  useEffect(() => {
    if (currentStep === 1) {
      setNextStepEnabled(step1Valid);
    } else if (currentStep === 2) {
      setNextStepEnabled(step2Valid);
    } else if (currentStep === 3) {
      setNextStepEnabled(step3Valid);
    } else if (currentStep === 4) {
      setNextStepEnabled(true);
    } else {
      setNextStepEnabled(false);
    }
  }, [step1Valid, step2Valid, step3Valid, currentStep]);

  const goBackHandler = () => setStep(prevState => prevState - 1);

  const nextStepHandler = useCallback(() => {
    if (nextStepEnabled) {
      if (currentStep === 4) return createInvoice();
      setStep(prevState => prevState + 1);
    }
    return () => undefined;
  }, [nextStepEnabled, currentStep, createInvoice]);

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
        // setters
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
        // creating invoice
        loading,
        createInvoice,
        // stepHandling
        currentStep,
        nextStepEnabled,
        goBackHandler,
        nextStepHandler,
      }}
    >
      {children}
    </CreateContext.Provider>
  );
};

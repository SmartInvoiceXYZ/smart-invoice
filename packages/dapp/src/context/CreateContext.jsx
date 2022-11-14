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
  getInvoiceFactoryAddress,
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
  const [projectAgreementLinkType, setProjectAgreementLinkType] =
    useState('https');
  const [projectAgreementSource, setProjectAgreementSource] = useState('');
  const [projectAgreement, setProjectAgreement] = useState([
    {
      type: projectAgreementLinkType,
      src: projectAgreementSource,
    },
  ]);
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
  const [requireVerification, setRequireVerification] = useState(true);

  // payments chunks
  const [payments, setPayments] = useState([BigNumber.from(0)]);
  const [tx, setTx] = useState();
  const [loading, setLoading] = useState(false);

  // const hre = require('hardhat');
  // const factory = await hre.ethers.getContractAt("SmartInvoiceFactory", "0x546adED0B0179d550e87cf909939a1207Fd26fB7");

  // step handling
  const [currentStep, setStep] = useState(1);
  const [nextStepEnabled, setNextStepEnabled] = useState(false);

  const step1Valid = useMemo(
    () =>
      projectName &&
      isValidLink(projectAgreementSource) &&
      safetyValveDate &&
      safetyValveDate > new Date().getTime(),
    [projectName, projectAgreementSource, safetyValveDate],
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
    setProjectAgreement([
      {
        type: projectAgreementLinkType,
        src: projectAgreementSource,
        createdAt: Date.now().toString(),
      },
    ]);
  }, [projectAgreementSource, projectAgreementLinkType]);

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
    projectAgreementLinkType,
    projectAgreementSource,
    startDate,
    endDate,
  ]);

  const createEscrow = useCallback(async () => {
    if (step1Valid && step2Valid && step3Valid && detailsHash) {
      setLoading(true);
      setTx();

      const resolverType = 0; // 0 for individual, 1 for erc-792 arbitrator
      const escrowType = utils.formatBytes32String('escrow');
      const factoryAddress = getInvoiceFactoryAddress(chainId);
      const data = utils.AbiCoder.prototype.encode(
        [
          'address',
          'uint8',
          'address',
          'address',
          'uint256',
          'bytes32',
          'address',
          'bool',
          'address',
        ],
        [
          clientAddress,
          resolverType,
          arbitrationProvider,
          paymentToken,
          Math.floor(safetyValveDate / 1000),
          detailsHash,
          paymentToken,
          requireVerification,
          factoryAddress,
        ],
      );

      const fee = await provider.getFeeData();

      console.log({ fee });

      const transaction = await register(
        factoryAddress,
        provider,
        paymentAddress,
        payments,
        data,
        escrowType,
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
    requireVerification,
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
      if (currentStep === 4) return createEscrow();
      setStep(prevState => prevState + 1);
    }
    return () => undefined;
  }, [nextStepEnabled, currentStep, createEscrow]);

  return (
    <CreateContext.Provider
      value={{
        projectName,
        projectDescription,
        projectAgreement,
        projectAgreementSource,
        projectAgreementLinkType,
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
        setProjectAgreementSource,
        setProjectAgreementLinkType,
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
        createEscrow,
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

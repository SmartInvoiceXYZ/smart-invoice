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

import { INSTANT_STEPS, ESCROW_STEPS } from '../utils/constants';

import { INVOICE_TYPES } from '../utils/constants';
import { useCreateInstant } from './create-hooks/useCreateInstant';
import { useCreateEscrow } from './create-hooks/useCreateEscrow';

export const CreateContext = createContext();

export const CreateContextProvider = ({ children }) => {
  const { provider: rpcProvider, chainId } = useContext(Web3Context);
  const RESOLVERS = getResolvers(chainId);
  const WRAPPED_NATIVE_TOKEN = getWrappedNativeToken(chainId);

  // project details
  const [invoiceType, setInvoiceType] = useState('');
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
  const [detailsHash, setDetailsHash] = useState(''); // ipfsHash for projectDetails

  // payment details
  const [clientAddress, setClientAddress] = useState('');
  const [paymentAddress, setPaymentAddress] = useState('');
  const [paymentDue, setPaymentDue] = useState(BigNumber.from(0));
  const [paymentToken, setPaymentToken] = useState(WRAPPED_NATIVE_TOKEN);
  const [milestones, setMilestones] = useState('1');

  // escrow details
  const [safetyValveDate, setSafetyValveDate] = useState();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [arbitrationProvider, setArbitrationProvider] = useState(RESOLVERS[0]);
  const [requireVerification, setRequireVerification] = useState(true);

  // instant payment details
  const [deadline, setDeadline] = useState(0);
  const [lateFee, setLateFee] = useState(BigNumber.from(0));
  const [lateFeeInterval, setLateFeeInterval] = useState(0);

  // payments chunks
  const [payments, setPayments] = useState([BigNumber.from(0)]);
  const [tx, setTx] = useState();
  const [loading, setLoading] = useState(false);

  // step handling
  const [currentStep, setStep] = useState(1);
  const [nextStepEnabled, setNextStepEnabled] = useState(false);
  const [allValid, setAllValid] = useState(false);

  const { Escrow, Instant } = INVOICE_TYPES;

  // common for all invoice types
  const step1Valid = useMemo(() => {
    if (invoiceType === Escrow) {
      return (
        projectName &&
        isValidLink(projectAgreementSource) &&
        safetyValveDate &&
        safetyValveDate > new Date().getTime()
      );
    } else if (invoiceType === Instant) {
      return projectName && isValidLink(projectAgreementSource);
    }
  }, [projectName, projectAgreementSource, safetyValveDate]);

  // handle invoice type
  const { escrowStep2Valid, escrowStep3Valid } = useCreateEscrow({
    step1Valid,
    allValid,
    clientAddress,
    paymentAddress,
    payments,
    paymentToken,
    paymentDue,
    milestones,
    termsAccepted,
    arbitrationProvider,
    setAllValid,
  });

  const { instantStep2Valid } = useCreateInstant({
    step1Valid,
    allValid,
    clientAddress,
    paymentAddress,
    paymentToken,
    paymentDue,
    milestones,
    setAllValid,
  });

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

  const encodeEscrowData = factoryAddress => {
    const resolverType = 0; // 0 for individual, 1 for erc-792 arbitrator
    const type = utils.formatBytes32String(Escrow);

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
        WRAPPED_NATIVE_TOKEN,
        requireVerification,
        factoryAddress,
      ],
    );

    return { type, data };
  };

  const encodeInstantData = () => {
    const type = utils.formatBytes32String(Instant);
    const data = utils.AbiCoder.prototype.encode(
      [
        'address',
        'address',
        'uint256',
        'bytes32',
        'address',
        'uint256',
        'uint256',
      ],
      [
        clientAddress,
        paymentToken,
        Math.floor(deadline / 1000),
        detailsHash,
        WRAPPED_NATIVE_TOKEN,
        lateFee,
        lateFeeInterval,
      ],
    );

    return { type, data };
  };

  const createInvoice = useCallback(async () => {
    let type;
    let data;

    if (allValid && detailsHash) {
      setLoading(true);
      setTx();

      const factoryAddress = getInvoiceFactoryAddress(chainId);

      if (invoiceType === Escrow) {
        const escrowInfo = encodeEscrowData(factoryAddress);
        type = escrowInfo.type;
        data = escrowInfo.data;
      } else if (invoiceType === Instant) {
        const instantInfo = encodeInstantData(factoryAddress);
        type = instantInfo.type;
        data = instantInfo.data;
      }

      const transaction = await register(
        factoryAddress,
        rpcProvider,
        paymentAddress,
        payments,
        data,
        type,
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
    rpcProvider,
    clientAddress,
    paymentAddress,
    arbitrationProvider,
    paymentToken,
    payments,
    safetyValveDate,
    detailsHash,
    requireVerification,
    step1Valid,
    escrowStep2Valid,
    instantStep2Valid,
    escrowStep3Valid,
    allValid,
    invoiceType,
  ]);

  // check here
  useEffect(() => {
    if (invoiceType === Escrow) {
      if (currentStep === 1) {
        setNextStepEnabled(step1Valid);
      } else if (currentStep === 2) {
        setNextStepEnabled(escrowStep2Valid);
      } else if (currentStep === 3) {
        setNextStepEnabled(escrowStep3Valid);
      } else if (currentStep === 4) {
        setNextStepEnabled(true);
      } else {
        setNextStepEnabled(false);
      }
    }

    if (invoiceType === Instant) {
      if (currentStep === 1) {
        setNextStepEnabled(step1Valid);
      } else if (currentStep === 2) {
        setNextStepEnabled(instantStep2Valid);
      } else if (currentStep === 3) {
        setNextStepEnabled(true);
      }
    }
  }, [
    step1Valid,
    escrowStep2Valid,
    escrowStep3Valid,
    instantStep2Valid,
    currentStep,
    invoiceType,
  ]);

  const goBackHandler = () => setStep(prevState => prevState - 1);

  const nextStepHandler = useCallback(() => {
    let maxStep;
    switch (invoiceType) {
      case Escrow:
        maxStep = Object.keys(ESCROW_STEPS).length;
        break;
      case Instant:
        maxStep = Object.keys(INSTANT_STEPS).length;
        break;
      default:
        maxStep = 0;
    }
    if (nextStepEnabled) {
      if (currentStep === maxStep) return createInvoice();
      setStep(prevState => prevState + 1);
    }
    return () => undefined;
  }, [nextStepEnabled, currentStep, invoiceType, createInvoice]);

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
        invoiceType,
        deadline,
        lateFee,
        lateFeeInterval,
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
        setInvoiceType,
        setDeadline,
        setLateFee,
        setLateFeeInterval,
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

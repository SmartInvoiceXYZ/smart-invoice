/* eslint-disable no-unused-vars */
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Address, Hash, encodeAbiParameters, parseAbiParameters, stringToHex } from 'viem';
import { useWalletClient } from 'wagmi';

import { track } from '@vercel/analytics';

import { ESCROW_STEPS, INSTANT_STEPS, INVOICE_TYPES } from '../constants';
import {
  getInvoiceFactoryAddress,
  getResolvers,
  getWrappedNativeToken,
  isValidLink,
  logError,
  sum,
} from '../utils/helpers';
import { register } from '../utils/invoice';
import { uploadMetadata } from '../utils/ipfs';
import { useCreateEscrow } from './create-hooks/useCreateEscrow';
import { useCreateInstant } from './create-hooks/useCreateInstant';

export type CreateContextType = {
  projectName?: string;
  projectDescription?: string;
  projectAgreement?: any;
  projectAgreementSource?: string;
  projectAgreementLinkType?: string;
  startDate?: number;
  endDate?: number;
  safetyValveDate?: number;
  clientAddress?: Address;
  paymentAddress?: Address;
  paymentDue?: bigint;
  paymentToken?: Address;
  milestones?: number;
  termsAccepted?: boolean;
  arbitrationProvider?: Address;
  payments?: bigint[];
  txHash?: Hash;
  invoiceType?: string;
  deadline?: number;
  lateFee?: bigint;
  lateFeeInterval?: number;
  // setters
  setProjectName: (v: string) => void;
  setProjectDescription: (v: string) => void;
  setProjectAgreement: (v: any) => void;
  setProjectAgreementSource: (v: string) => void;
  setProjectAgreementLinkType: (v: string) => void;
  setStartDate: (v: any) => void;
  setEndDate: (v: any) => void;
  setSafetyValveDate: (v: number) => void;
  setClientAddress: (v: Address) => void;
  setPaymentAddress: (v: Address) => void;
  setPaymentDue: (v: bigint) => void;
  setPaymentToken: (v: Address) => void;
  setMilestones: (v: number) => void;
  setTermsAccepted: (v: boolean) => void;
  setArbitrationProvider: (v: Address) => void;
  setPayments: (v: bigint[]) => void;
  setInvoiceType: (v: string) => void;
  setDeadline: (v: number) => void;
  setLateFee: (v: bigint) => void;
  setLateFeeInterval: (v: number) => void;
  // creating invoice
  loading: boolean;
  createInvoice: () => void;
  // stepHandling
  currentStep: number;
  nextStepEnabled: boolean;
  goBackHandler: () => void;
  nextStepHandler: () => void;
};

export const CreateContext = createContext<CreateContextType>({
  // setters
  setProjectName: () => {},
  setProjectDescription: () => {},
  setProjectAgreement: () => {},
  setProjectAgreementSource: () => {},
  setProjectAgreementLinkType: () => {},
  setStartDate: () => {},
  setEndDate: () => {},
  setSafetyValveDate: () => {},
  setClientAddress: () => {},
  setPaymentAddress: () => {},
  setPaymentDue: () => {},
  setPaymentToken: () => {},
  setMilestones: () => {},
  setTermsAccepted: () => {},
  setArbitrationProvider: () => {},
  setPayments: () => {},
  setInvoiceType: () => {},
  setDeadline: () => {},
  setLateFee: () => {},
  setLateFeeInterval: () => {},
  // creating invoice
  loading: true,
  createInvoice: () => {},
  // stepHandling
  currentStep: 0,
  nextStepEnabled: false,
  goBackHandler: () => {},
  nextStepHandler: () => {},
});

export const CreateContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const {data: walletClient} = useWalletClient();
  const chainId = walletClient?.chain?.id;
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
      createdAt: Date.now().toString(),
    },
  ]);
  const [startDate, setStartDate] = useState<number>();
  const [endDate, setEndDate] = useState<number>();
  const [detailsHash, setDetailsHash] = useState<Hash>(); // ipfsHash for projectDetails

  // payment details
  const [clientAddress, setClientAddress] = useState<Address>();
  const [paymentAddress, setPaymentAddress] = useState<Address>();
  const [paymentDue, setPaymentDue] = useState(BigInt(0));
  const [paymentToken, setPaymentToken] = useState<Address>(WRAPPED_NATIVE_TOKEN);
  const [milestones, setMilestones] = useState(1);

  // escrow details
  const [safetyValveDate, setSafetyValveDate] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [arbitrationProvider, setArbitrationProvider] = useState(RESOLVERS[0]);
  // eslint-disable-next-line no-unused-vars
  const [requireVerification, setRequireVerification] = useState(true);

  // instant payment details
  const [deadline, setDeadline] = useState(0);
  const [lateFee, setLateFee] = useState(BigInt(0));
  const [lateFeeInterval, setLateFeeInterval] = useState(0);

  // payments chunks
  const [payments, setPayments] = useState([BigInt(0)]);
  const [txHash, setTxHash] = useState<Hash>();
  const [loading, setLoading] = useState(false);

  // step handling
  const [currentStep, setStep] = useState(1);
  const [nextStepEnabled, setNextStepEnabled] = useState(false);
  const [allValid, setAllValid] = useState(false);

  useEffect(() => {
    track('CreateInvoice', { invoiceType, currentStep });
  }, [invoiceType, currentStep]);

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
    }
    if (invoiceType === Instant) {
      return projectName && isValidLink(projectAgreementSource);
    }
    return false;
  }, [
    projectName,
    projectAgreementSource,
    safetyValveDate,
    Escrow,
    Instant,
    invoiceType,
  ]);

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
    if (step1Valid && currentStep === 2 && startDate && endDate) {
      uploadMetadata({
        projectName,
        projectDescription,
        projectAgreement,
        startDate: Math.floor(startDate / 1000),
        endDate: Math.floor(endDate / 1000),
      })
        .then(hash => setDetailsHash(hash))
        .catch(ipfsError => {
          logError({ ipfsError });
        });
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

  const encodeEscrowData = useCallback(
    (factoryAddress: Address) => {
      if (!clientAddress) throw new Error('Invalid client address');
      if (!detailsHash) throw new Error('Invalid details hash');

      const resolverType = 0; // 0 for individual, 1 for erc-792 arbitrator
      const type = stringToHex(Escrow, {size: 32});
      const data = encodeAbiParameters(
        parseAbiParameters('address, uint8, address, address, uint256, bytes32, address, bool, address'),
        [
          clientAddress,
          resolverType,
          arbitrationProvider,
          paymentToken,
          BigInt(Math.floor(safetyValveDate / 1000)),
          detailsHash,
          WRAPPED_NATIVE_TOKEN,
          requireVerification,
          factoryAddress,
        ],
      );

      return { type, data };
    },
    [
      clientAddress,
      arbitrationProvider,
      paymentToken,
      safetyValveDate,
      detailsHash,
      WRAPPED_NATIVE_TOKEN,
      requireVerification,
      Escrow,
    ],
  );

  const encodeInstantData = useCallback(() => {
    if (!clientAddress) throw new Error('Invalid client address');
    if (!detailsHash) throw new Error('Invalid details hash');
    const type = stringToHex(Instant, {size: 32});
    const data = encodeAbiParameters(
      parseAbiParameters(
        'address, address, uint256, bytes32, address, uint256, uint256'),
      [
        clientAddress,
        paymentToken,
        BigInt(Math.floor(deadline / 1000)),
        detailsHash,
        WRAPPED_NATIVE_TOKEN,
        lateFee,
        BigInt(lateFeeInterval),
      ],
    );

    return { type, data };
  }, [
    clientAddress,
    paymentToken,
    deadline,
    detailsHash,
    WRAPPED_NATIVE_TOKEN,
    lateFee,
    lateFeeInterval,
    Instant,
  ]);

  const createInvoice = useCallback(async () => {
    let type;
    let data;

    if (chainId && allValid && paymentAddress && data &&  detailsHash && type) {
      setLoading(true);
      setTxHash(undefined);

      const factoryAddress = getInvoiceFactoryAddress(chainId);

      let paymentAmounts = [BigInt(0)];
      if (invoiceType === Escrow) {
        const escrowInfo = encodeEscrowData(factoryAddress);
        type = escrowInfo.type;
        data = escrowInfo.data;
        paymentAmounts = payments;
      } else if (invoiceType === Instant) {
        const instantInfo = encodeInstantData();
        type = instantInfo.type;
        data = instantInfo.data;
        paymentAmounts = [paymentDue];
      }

      const hash = await register(
        factoryAddress,
        walletClient,
        paymentAddress,
        paymentAmounts,
        data,
        type,
      ).catch(registerError => {
        logError({ registerError });
        setLoading(false);
        throw registerError;
      });

      setTxHash(hash);
      setLoading(false);

      const paymentTotal = sum(paymentAmounts);

      track('InvoiceCreated', {
        chain: chainId ?? -1,
        invoiceType,
        paymentToken,
        paymentTotal,
      });
    } else {
      logError(
        `unable to create invoice: allValid: ${allValid}, detailsHash: ${detailsHash}`,
      );
    }
  }, [
    allValid,
    detailsHash,
    chainId,
    invoiceType,
    Escrow,
    Instant,
    walletClient,
    paymentAddress,
    paymentToken,
    encodeEscrowData,
    payments,
    encodeInstantData,
    paymentDue,
  ]);

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
    Escrow,
    Instant,
  ]);

  const goBackHandler = useCallback(
    () => setStep((prevState: any) => prevState - 1),
    [setStep],
  );

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
      setStep((prevState: any) => prevState + 1);
    }
    return () => undefined;
  }, [
    nextStepEnabled,
    currentStep,
    invoiceType,
    createInvoice,
    Escrow,
    Instant,
  ]);

  const returnValue = useMemo(
    () => ({
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
      txHash,
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
    }),
    [
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
      txHash,
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
    ],
  );

  return (
    <CreateContext.Provider value={returnValue}>
      {children}
    </CreateContext.Provider>
  );
}

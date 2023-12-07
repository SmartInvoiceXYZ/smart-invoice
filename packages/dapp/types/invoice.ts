import { BigNumber } from "ethers";
import { Network } from "./network";

export type DisputeDetails = {
    id: string;
    invoice: string;
    ipfsHash: string;
    txHash: string;
    timestamp: number;
    amount: BigNumber;
    reason: string;
    status: string;
    resolver: string;
    disputeTx: string;
    resolutionTx: string;
  };

export type InvoiceTx = {
    id: string;
    invoice: string;
    amount: BigNumber;    
    timestamp: number;
    txHash: string;
  };

  export type ResolutionDetails = {
    id: string;
    invoice: string;
    ipfsHash: string;
    txHash: string;
    timestamp: number;
    amount: BigNumber;
    reason: string;
    status: string;
    resolver: string;
    disputeTx: string;
    resolutionTx: string;
    clientAward: BigNumber;
    providerAward: BigNumber;
    resolutionFee: BigNumber;
  };

export type Invoice = {
    id: string;
    address: string;
    network: Network;
    invoiceType: 'escrow' | 'instant';
    token: string;
    projectName: string;
    projectDescription: string;
    projectAgreement: string;
    startDate: Date;
    endDate: Date;
    terminationTime: number;
    client: string;
    provider: string;
    resolver: string;
    currentMilestone: number;
    amounts: number[];
    total: number;
    released: number;
    isLocked: boolean;
    deposits: InvoiceTx[];
    releases: InvoiceTx[];
    disputes: DisputeDetails[];
    resolutions: ResolutionDetails[];
    verified: boolean;
  };
  

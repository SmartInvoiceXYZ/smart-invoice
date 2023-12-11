import { Address, BigInt, Bytes, ByteArray } from '@graphprotocol/graph-ts';

import { Agreement, Invoice } from '../../types/schema';

import { updateEscrowInfo } from './helpers/escrow';
import { updateInstantInfo } from './helpers/instant';
import { updateSplitEscrowInfo } from './helpers/split-escrow';
import { updateUpdatableInfo } from './helpers/updatable-escrow';

let zeroAddress = changetype<Address>(
  Address.fromHexString('0x0000000000000000000000000000000000000000'),
);

let zeroBytes = changetype<Bytes>(Bytes.fromHexString('0x'));

export class InvoiceObject {
  client: Address;
  provider: Address;
  resolverType: i32;
  resolver: Address;
  resolutionRate: BigInt;
  token: Address;
  isLocked: boolean;
  currentMilestone: BigInt;
  total: BigInt;
  released: BigInt;
  terminationTime: BigInt;
  details: Bytes;
  ipfsHash: string;
  disputeId: BigInt;
  projectName: string;
  projectDescription: string;
  projectAgreement: Array<Agreement>;
  startDate: BigInt;
  endDate: BigInt;
  invoiceType: String;
  version: BigInt;
  lateFee: BigInt;
  lateFeeTimeInterval: BigInt;
  // tipAmount: Array<Tip>;
  deadline: BigInt;
  fulfilled: boolean;
  dao: Address;
  daoFee: BigInt;
  providerReceiver: Address;

  constructor() {
    this.client = zeroAddress;
    this.provider = zeroAddress;
    this.providerReceiver = zeroAddress;
    this.resolverType = 0;
    this.resolver = zeroAddress;
    this.resolutionRate = BigInt.fromI32(0);
    this.token = zeroAddress;
    this.isLocked = false;
    this.currentMilestone = BigInt.fromI32(0);
    this.total = BigInt.fromI32(0);
    this.released = BigInt.fromI32(0);
    this.terminationTime = BigInt.fromI32(0);
    this.details = zeroBytes;
    this.ipfsHash = '';
    this.disputeId = BigInt.fromI32(0);
    this.projectName = '';
    this.projectDescription = '';
    this.projectAgreement = new Array<Agreement>();
    this.startDate = BigInt.fromI32(0);
    this.endDate = BigInt.fromI32(0);
    this.invoiceType = '';
    this.version = BigInt.fromI32(0);
    this.lateFee = BigInt.fromI32(0);
    this.lateFeeTimeInterval = BigInt.fromI32(0);
    // this.tipAmount = new Array<Tip>();
    this.deadline = BigInt.fromI32(0);
    this.fulfilled = false;
    this.dao = zeroAddress;
    this.daoFee = BigInt.fromI32(0);
  }
}

export function addQm(a: ByteArray): ByteArray {
  let out = new Uint8Array(34);
  out[0] = 0x12;
  out[1] = 0x20;
  for (let i = 0; i < 32; i++) {
    out[i + 2] = a[i];
  }
  return changetype<ByteArray>(out);
}

export function updateInvoice(address: Address, invoice: Invoice): Invoice {
  if (invoice == null) return invoice;

  let type = invoice.invoiceType;
  if (type == null) return invoice;

  if (type == 'escrow') {
    invoice = updateEscrowInfo(address, invoice);
  } else if (type == 'split-escrow') {
    invoice = updateSplitEscrowInfo(address, invoice);
  } else if (type == 'updatable') {
    invoice = updateUpdatableInfo(address, invoice);
  } else {
    invoice = updateInstantInfo(address, invoice);
  }

  return invoice;
}

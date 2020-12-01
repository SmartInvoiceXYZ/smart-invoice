import {
  Address,
  BigInt,
  Bytes,
  ByteArray,
  ipfs,
  json,
  log,
} from '@graphprotocol/graph-ts';

import {Invoice} from '../generated/schema';
import {SmartInvoiceMono} from '../generated/SmartInvoiceMono/SmartInvoiceMono';

// Helper adding 0x12 and 0x20 to make the proper ipfs hash
// the returned bytes32 is so [0,31]
export function addQm(a: ByteArray): ByteArray {
  let out = new Uint8Array(34);
  out[0] = 0x12;
  out[1] = 0x20;
  for (let i = 0; i < 32; i++) {
    out[i + 2] = a[i];
  }
  return out as ByteArray;
}

class InvoiceObject {
  client: Address;
  provider: Address;
  resolverType: i32;
  resolver: Address;
  token: Address;
  isLocked: boolean;
  currentMilestone: BigInt;
  total: BigInt;
  balance: BigInt;
  released: BigInt;
  terminationTime: BigInt;
  details: Bytes;
  projectName: string;
  projectDescription: string;
  projectAgreement: string;
  startDate: BigInt;
  endDate: BigInt;
}

export function fetchInvoiceInfo(
  address: Address,
  index: BigInt,
): InvoiceObject | null {
  let invoicesInstance = SmartInvoiceMono.bind(address);
  let invoiceObject = new InvoiceObject();

  let invoiceCall = invoicesInstance.try_invoices(index);

  if (!invoiceCall.reverted) {
    let invoiceResult = invoiceCall.value;
    invoiceObject.client = invoiceResult.value0;
    invoiceObject.provider = invoiceResult.value1;
    invoiceObject.resolverType = invoiceResult.value2;
    invoiceObject.resolver = invoiceResult.value3;
    invoiceObject.token = invoiceResult.value4;
    invoiceObject.isLocked = invoiceResult.value5;
    invoiceObject.currentMilestone = invoiceResult.value6;
    invoiceObject.total = invoiceResult.value7;
    invoiceObject.balance = invoiceResult.value8;
    invoiceObject.released = invoiceResult.value9;
    invoiceObject.terminationTime = invoiceResult.value10;
    invoiceObject.details = invoiceResult.value11;
    let hexHash = addQm(invoiceObject.details) as Bytes;
    let base58Hash = hexHash.toBase58();
    let getIPFSData = ipfs.cat(base58Hash);
    log.debug('IPFS details {} hash {}', [hexHash.toHexString(), base58Hash]);
    if (getIPFSData != null) {
      let data = json.fromBytes(getIPFSData as Bytes).toObject();
      //   projectName: string;
      //   projectDescription: string;
      //   projectAgreement: string;
      //   startDate: number; // seconds since epoch
      //   endDate: number; // seconds since epoch
      let projectName = data.get('projectName');
      if (!projectName.isNull()) {
        invoiceObject.projectName = projectName.toString();
      }
      let projectDescription = data.get('projectDescription');
      if (!projectDescription.isNull()) {
        invoiceObject.projectDescription = projectDescription.toString();
      }
      let projectAgreement = data.get('projectAgreement');
      if (!projectAgreement.isNull()) {
        invoiceObject.projectAgreement = projectAgreement.toString();
      }
      let startDate = data.get('startDate');
      if (!startDate.isNull()) {
        invoiceObject.startDate = startDate.toBigInt();
      }
      let endDate = data.get('endDate');
      if (!endDate.isNull()) {
        invoiceObject.endDate = endDate.toBigInt();
      }
    }
  }

  return invoiceObject;
}

export function updateInvoiceInfo(
  address: Address,
  index: BigInt,
  invoice: Invoice | null,
): Invoice | null {
  if (invoice == null) {
    return invoice;
  }
  let invoiceObject = fetchInvoiceInfo(address, index);
  invoice.token = invoiceObject.token;
  invoice.client = invoiceObject.client;
  invoice.provider = invoiceObject.provider;
  if (invoiceObject.resolverType == 0) {
    invoice.resolverType = 'lexDao';
  } else if (invoiceObject.resolverType == 1) {
    invoice.resolverType = 'aragonCourt';
  }
  invoice.resolver = invoiceObject.resolver;
  invoice.isLocked = invoiceObject.isLocked;
  invoice.currentMilestone = invoiceObject.currentMilestone;
  invoice.total = invoiceObject.total;
  invoice.balance = invoiceObject.balance;
  invoice.released = invoiceObject.released;
  invoice.terminationTime = invoiceObject.terminationTime;
  invoice.details = invoiceObject.details;
  invoice.projectName = invoiceObject.projectName;
  invoice.projectDescription = invoiceObject.projectDescription;
  invoice.projectAgreement = invoiceObject.projectAgreement;
  invoice.startDate = invoiceObject.startDate;
  invoice.endDate = invoiceObject.endDate;

  return invoice;
}

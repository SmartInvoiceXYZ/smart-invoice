import {
  Address,
  BigInt,
  Bytes,
  ByteArray,
  ipfs,
  json,
  log,
} from '@graphprotocol/graph-ts';

import { Invoice } from '../generated/schema';
import { SmartInvoice } from '../generated/SmartInvoiceFactory/SmartInvoice';

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
  released: BigInt;
  terminationTime: BigInt;
  details: Bytes;
  disputeId: BigInt;
  projectName: string;
  projectDescription: string;
  projectAgreement: string;
  startDate: BigInt;
  endDate: BigInt;
}

export function fetchInvoiceInfo(address: Address): InvoiceObject | null {
  let invoiceInstance = SmartInvoice.bind(address);
  let invoiceObject = new InvoiceObject();

  let client = invoiceInstance.try_client();
  let provider = invoiceInstance.try_provider();
  let resolverType = invoiceInstance.try_resolverType();
  let resolver = invoiceInstance.try_resolver();
  let token = invoiceInstance.try_token();
  let locked = invoiceInstance.try_locked();
  let milestone = invoiceInstance.try_milestone();
  let total = invoiceInstance.try_total();
  let released = invoiceInstance.try_released();
  let terminationTime = invoiceInstance.try_terminationTime();
  let details = invoiceInstance.try_details();
  let disputeId = invoiceInstance.try_disputeId();

  if (!client.reverted) {
    invoiceObject.client = client.value;
  }
  if (!provider.reverted) {
    invoiceObject.provider = provider.value;
  }
  if (!resolverType.reverted) {
    invoiceObject.resolverType = resolverType.value;
  }
  if (!resolver.reverted) {
    invoiceObject.resolver = resolver.value;
  }
  if (!token.reverted) {
    invoiceObject.token = token.value;
  }
  if (!locked.reverted) {
    invoiceObject.isLocked = locked.value;
  }
  if (!milestone.reverted) {
    invoiceObject.currentMilestone = milestone.value;
  }
  if (!total.reverted) {
    invoiceObject.total = total.value;
  }
  if (!released.reverted) {
    invoiceObject.released = released.value;
  }
  if (!terminationTime.reverted) {
    invoiceObject.terminationTime = terminationTime.value;
  }
  if (!disputeId.reverted) {
    invoiceObject.disputeId = disputeId.value;
  }
  if (!details.reverted) {
    invoiceObject.details = details.value;
    let hexHash = addQm(invoiceObject.details) as Bytes;
    let base58Hash = hexHash.toBase58();
    let ipfsData = ipfs.cat(base58Hash);
    log.debug('IPFS details from hash {}', [base58Hash]);
    if (ipfsData != null) {
      let data = json.fromBytes(ipfsData as Bytes).toObject();
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
  invoice: Invoice | null,
): Invoice | null {
  if (invoice == null) {
    return invoice;
  }
  let invoiceObject = fetchInvoiceInfo(address);
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

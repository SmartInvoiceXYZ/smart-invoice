import {
  Address,
  BigInt,
  Bytes,
  ByteArray,
  ipfs,
  box,
  json,
  log,
  TypedMap,
  JSONValue,
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
  name: string;
  description: string;
  link: string;
  startTime: BigInt;
  endTime: BigInt;
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
      let name = data.get('name');
      if (name != null) {
        invoiceObject.name = name.toString();
      }
      let description = data.get('description');
      if (description != null) {
        invoiceObject.description = description.toString();
      }
      let link = data.get('link');
      if (link != null) {
        invoiceObject.link = link.toString();
      }
      let startTime = data.get('startTime');
      if (startTime != null) {
        invoiceObject.startTime = startTime.toBigInt();
      }
      let endTime = data.get('endTime');
      if (endTime != null) {
        invoiceObject.endTime = endTime.toBigInt();
      }
    }
  }

  return invoiceObject;
}

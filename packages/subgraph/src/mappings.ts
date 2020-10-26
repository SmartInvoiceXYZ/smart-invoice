import {Bytes, log} from '@graphprotocol/graph-ts';

import {Invoice} from '../generated/schema';

import {
  Register,
  Deposit,
  Release,
  Withdraw,
  Lock,
  Resolve,
  Rule,
} from '../generated/SmartInvoiceMono/SmartInvoiceMono';
import {fetchInvoiceInfo} from './helpers';

export function handleRegister(event: Register): void {
  log.debug('Parsing Register', []);
  let txHash = event.transaction.hash.toHex();
  let invoice = new Invoice(txHash);

  let invoiceObject = fetchInvoiceInfo(event.address, event.params.index);
  invoice.index = event.params.index;
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
  invoice.amounts = event.params.amounts;
  invoice.numMilestones = event.params.amounts.length;
  invoice.currentMilestone = invoiceObject.currentMilestone;
  invoice.total = invoiceObject.total;
  invoice.balance = invoiceObject.balance;
  invoice.released = invoiceObject.released;
  invoice.timestamp = event.block.timestamp;
  invoice.terminationTime = invoiceObject.terminationTime;
  invoice.details = invoiceObject.details;
  invoice.name = invoiceObject.name;
  invoice.description = invoiceObject.description;
  invoice.link = invoiceObject.link;
  invoice.startTime = invoiceObject.startTime;
  invoice.endTime = invoiceObject.endTime;
  invoice.status = 'awaitingFunding';
}

export function handleDeposit(event: Deposit): void {}

export function handleRelease(event: Release): void {}

export function handleWithdraw(event: Withdraw): void {}

export function handleLock(event: Lock): void {}

export function handleResolve(event: Resolve): void {}

export function handleRule(event: Rule): void {}

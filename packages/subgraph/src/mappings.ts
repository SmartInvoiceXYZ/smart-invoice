import { Invoice, Release, Withdraw } from '../generated/schema';
import { log } from '@graphprotocol/graph-ts';

import { LogNewInvoice as LogNewInvoiceEvent } from '../generated/SmartInvoiceFactory/SmartInvoiceFactory';
import {
  Release as ReleaseEvent,
  Withdraw as WithdrawEvent,
  Lock as LockEvent,
} from '../generated/SmartInvoice/SmartInvoice';
import { fetchInvoiceInfo, updateInvoiceInfo } from './helpers';

export function handleLogNewInvoice(event: LogNewInvoiceEvent): void {
  let invoice = new Invoice(event.params.invoice.toHexString());

  invoice.address = event.params.invoice;
  invoice.amounts = event.params.amounts;
  invoice.numMilestones = event.params.amounts.length;

  log.debug('handleLogNewInvoice index {}', [event.params.invoice.toString()]);
  let invoiceObject = fetchInvoiceInfo(event.params.invoice);
  if (invoiceObject.projectName.length == 0) return;
  invoice.token = invoiceObject.token;
  invoice.client = invoiceObject.client;
  invoice.provider = invoiceObject.provider;
  if (invoiceObject.resolverType == 0) {
    invoice.resolverType = 'lex_dao';
  } else if (invoiceObject.resolverType == 1) {
    invoice.resolverType = 'aragon_court';
  }
  invoice.resolver = invoiceObject.resolver;
  invoice.isLocked = invoiceObject.isLocked;
  invoice.currentMilestone = invoiceObject.currentMilestone;
  invoice.total = invoiceObject.total;
  invoice.released = invoiceObject.released;
  invoice.terminationTime = invoiceObject.terminationTime;
  invoice.details = invoiceObject.details;
  invoice.disputeId = invoiceObject.disputeId;
  invoice.projectName = invoiceObject.projectName;
  invoice.projectDescription = invoiceObject.projectDescription;
  invoice.projectAgreement = invoiceObject.projectAgreement;
  invoice.startDate = invoiceObject.startDate;
  invoice.endDate = invoiceObject.endDate;

  invoice.createdAt = event.block.timestamp;

  invoice.save();
}

export function handleRelease(event: ReleaseEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.debug('handleRelease {}', [event.address.toHexString()]);
    invoice = updateInvoiceInfo(event.address, invoice);
    invoice.save();

    let release = new Release(event.transaction.hash.toHexString());

    release.invoice = invoice.id;
    release.milestone = event.params.milestone;
    release.amount = event.params.amount;
    release.timestamp = event.block.timestamp;

    release.save();
  }
}

export function handleWithdraw(event: WithdrawEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, invoice);
    invoice.save();

    let withdraw = new Withdraw(event.transaction.hash.toHexString());

    withdraw.invoice = invoice.id;
    withdraw.amount = event.params.balance;
    withdraw.timestamp = event.block.timestamp;

    withdraw.save();
  }
}

export function handleLock(event: LockEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, invoice);
    invoice.save();
  }
}

// export function handleDisputeFee(event: DisputeFeeEvent): void {
//   let dispute = Dispute.load(event.transaction.hash.toHexString());
//   if (dispute != null) {
//     dispute.disputeId = event.params.disputeId;
//     dispute.disputeToken = event.params.disputeToken;
//     dispute.disputeFee = event.params.disputeFee;
//     dispute.save();
//   }
// }

// export function handleResolve(event: ResolveEvent): void {
//   let invoice = Invoice.load(event.params.index.toHexString());
//   if (invoice != null) {
//     invoice = updateInvoiceInfo(event.address, event.params.index, invoice);
//     invoice.save();

//     let resolution = new Resolution(event.transaction.hash.toHexString());

//     resolution.resolverType = invoice.resolverType;
//     resolution.resolver = invoice.resolver;
//     resolution.invoice = invoice.id;
//     resolution.clientAward = event.params.clientAward;
//     resolution.providerAward = event.params.providerAward;
//     resolution.resolutionDetails = event.params.details;
//     resolution.timestamp = event.block.timestamp;

//     resolution.save();
//   }
// }

// export function handleRule(event: RuleEvent): void {
//   let invoice = Invoice.load(event.params.index.toHexString());
//   if (invoice != null) {
//     invoice = updateInvoiceInfo(event.address, event.params.index, invoice);
//     invoice.save();

//     let resolution = new Resolution(event.transaction.hash.toHexString());

//     resolution.resolverType = invoice.resolverType;
//     resolution.resolver = invoice.resolver;
//     resolution.invoice = invoice.id;
//     resolution.clientAward = event.params.clientAward;
//     resolution.providerAward = event.params.providerAward;
//     resolution.ruling = event.params.ruling;
//     resolution.timestamp = event.block.timestamp;

//     resolution.save();
//   }
// }

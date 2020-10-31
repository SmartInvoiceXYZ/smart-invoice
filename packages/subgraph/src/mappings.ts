import {
  Invoice,
  Deposit,
  Release,
  Withdraw,
  Dispute,
  Resolution,
} from '../generated/schema';

import {
  Register as RegisterEvent,
  Deposit as DepositEvent,
  Release as ReleaseEvent,
  Withdraw as WithdrawEvent,
  Lock as LockEvent,
  DisputeFee as DisputeFeeEvent,
  Resolve as ResolveEvent,
  Rule as RuleEvent,
} from '../generated/SmartInvoiceMono/SmartInvoiceMono';
import { updateInvoiceInfo, fetchInvoiceInfo } from './helpers';

export function handleRegister(event: RegisterEvent): void {
  let invoice = new Invoice(event.params.index.toHexString());

  invoice.index = event.params.index;
  invoice.amounts = event.params.amounts;
  invoice.numMilestones = event.params.amounts.length;

  let invoiceObject = fetchInvoiceInfo(event.address, event.params.index);
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
  invoice.name = invoiceObject.name;
  invoice.description = invoiceObject.description;
  invoice.link = invoiceObject.link;
  invoice.startTime = invoiceObject.startTime;
  invoice.endTime = invoiceObject.endTime;

  invoice.createdAt = event.block.timestamp;
  invoice.status = 'awaitingFunding';

  invoice.save();
}

export function handleDeposit(event: DepositEvent): void {
  let invoice = Invoice.load(event.params.index.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, event.params.index, invoice);
    if (invoice.balance.plus(invoice.released) == invoice.total) {
      invoice.status = 'funded';
    }
    // if (invoice.terminationTime >= currentTime) {
    //   invoice.status = 'expired';
    // }
    invoice.save();

    let deposit = new Deposit(event.transaction.hash.toHexString());

    deposit.invoice = invoice.id;
    deposit.sender = event.params.sender;
    deposit.amount = event.params.amount;
    deposit.timestamp = event.block.timestamp;

    deposit.save();
  }
}

export function handleRelease(event: ReleaseEvent): void {
  let invoice = Invoice.load(event.params.index.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, event.params.index, invoice);
    if (invoice.released == invoice.total) {
      invoice.status = 'completed';
    }
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
  let invoice = Invoice.load(event.params.index.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, event.params.index, invoice);
    // if (invoice.released == invoice.total) {
    //   invoice.status = 'completed';
    // }
    invoice.save();

    let withdraw = new Withdraw(event.transaction.hash.toHexString());

    withdraw.invoice = invoice.id;
    withdraw.amount = event.params.balance;
    withdraw.timestamp = event.block.timestamp;

    withdraw.save();
  }
}

export function handleLock(event: LockEvent): void {
  let invoice = Invoice.load(event.params.index.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, event.params.index, invoice);
    invoice.status = 'inDispute';
    invoice.save();

    let dispute = new Dispute(event.transaction.hash.toHexString());

    dispute.invoice = invoice.id;
    dispute.sender = event.params.sender;
    dispute.details = event.params.details;
    dispute.amount = invoice.balance;
    dispute.timestamp = event.block.timestamp;

    dispute.save();
  }
}

export function handleDisputeFee(event: DisputeFeeEvent): void {
  let dispute = Dispute.load(event.transaction.hash.toHexString());
  if (dispute != null) {
    dispute.disputeId = event.params.disputeId;
    dispute.disputeToken = event.params.disputeToken;
    dispute.disputeFee = event.params.disputeFee;
    dispute.save();
  }
}

export function handleResolve(event: ResolveEvent): void {
  let invoice = Invoice.load(event.params.index.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, event.params.index, invoice);
    invoice.status = 'disputeResolved';
    invoice.save();

    let resolution = new Resolution(event.transaction.hash.toHexString());

    resolution.resolverType = invoice.resolverType;
    resolution.resolver = invoice.resolver;
    resolution.invoice = invoice.id;
    resolution.clientAward = event.params.clientAward;
    resolution.providerAward = event.params.providerAward;
    resolution.resolutionDetails = event.params.details;
    resolution.timestamp = event.block.timestamp;

    resolution.save();
  }
}

export function handleRule(event: RuleEvent): void {
  let invoice = Invoice.load(event.params.index.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, event.params.index, invoice);
    invoice.status = 'disputeResolved';
    invoice.save();

    let resolution = new Resolution(event.transaction.hash.toHexString());

    resolution.resolverType = invoice.resolverType;
    resolution.resolver = invoice.resolver;
    resolution.invoice = invoice.id;
    resolution.clientAward = event.params.clientAward;
    resolution.providerAward = event.params.providerAward;
    resolution.ruling = event.params.ruling;
    resolution.timestamp = event.block.timestamp;

    resolution.save();
  }
}

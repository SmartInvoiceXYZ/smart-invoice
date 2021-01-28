import { Bytes } from '@graphprotocol/graph-ts';
import {
  Invoice,
  Release,
  Withdraw,
  Dispute,
  Resolution,
  Deposit,
} from '../generated/schema';
import { log } from '@graphprotocol/graph-ts';

import { LogNewInvoice as LogNewInvoiceEvent } from '../generated/SmartInvoiceFactory/SmartInvoiceFactory';
import {
  Release as ReleaseEvent,
  Withdraw as WithdrawEvent,
  Lock as LockEvent,
  Resolve as ResolveEvent,
  Deposit as DepositEvent,
} from '../generated/SmartInvoice/SmartInvoice';
import { Transfer as TransferEvent } from '../generated/ERC20/ERC20';
import { addQm, updateInvoiceInfo } from './helpers';

export function handleLogNewInvoice(event: LogNewInvoiceEvent): void {
  let invoice = new Invoice(event.params.invoice.toHexString());

  log.debug('handleLogNewInvoice {}', [event.params.invoice.toString()]);

  invoice.address = event.params.invoice;
  invoice.amounts = event.params.amounts;
  invoice.numMilestones = event.params.amounts.length;
  invoice.createdAt = event.block.timestamp;
  invoice.releases = new Array<string>();
  invoice.disputes = new Array<string>();
  invoice.resolutions = new Array<string>();

  invoice = updateInvoiceInfo(event.params.invoice, invoice);
  if (invoice.projectName.length == 0) return;
  invoice.save();
}

export function handleRelease(event: ReleaseEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.debug('handleRelease {}', [event.address.toHexString()]);
    invoice = updateInvoiceInfo(event.address, invoice);

    let release = new Release(event.transaction.hash.toHexString());
    release.invoice = invoice.id;
    release.milestone = event.params.milestone;
    release.amount = event.params.amount;
    release.timestamp = event.block.timestamp;
    release.save();

    let releases = invoice.releases;
    releases.push(release.id);
    invoice.releases = releases;
    invoice.save();
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

    let dispute = new Dispute(event.transaction.hash.toHexString());
    dispute.invoice = event.address.toHexString();
    dispute.sender = event.params.sender;
    dispute.details = event.params.details;
    let hexHash = addQm(dispute.details) as Bytes;
    let base58Hash = hexHash.toBase58();
    dispute.ipfsHash = base58Hash;
    dispute.timestamp = event.block.timestamp;
    dispute.save();

    let disputes = invoice.disputes;
    disputes.push(dispute.id);
    invoice.disputes = disputes;
    invoice.save();
  }
}

export function handleResolve(event: ResolveEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, invoice);

    let resolution = new Resolution(event.transaction.hash.toHexString());
    resolution.details = event.params.details;
    let hexHash = addQm(resolution.details) as Bytes;
    let base58Hash = hexHash.toBase58();
    resolution.ipfsHash = base58Hash;
    resolution.resolverType = invoice.resolverType;
    resolution.resolver = invoice.resolver;
    resolution.invoice = invoice.id;
    resolution.clientAward = event.params.clientAward;
    resolution.providerAward = event.params.providerAward;
    resolution.resolutionFee = event.params.resolutionFee;
    resolution.resolutionDetails = event.params.details;
    resolution.timestamp = event.block.timestamp;
    resolution.save();

    let resolutions = invoice.resolutions;
    resolutions.push(resolution.id);
    invoice.resolutions = resolutions;
    invoice.save();
  }
}

export function handleDeposit(event: DepositEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, invoice);

    let deposit = new Deposit(event.transaction.hash.toHexString());
    deposit.invoice = invoice.id;
    deposit.sender = event.params.sender;
    deposit.amount = event.params.amount;
    deposit.timestamp = event.block.timestamp;
    deposit.save();

    let deposits = invoice.deposits;
    deposits.push(deposit.id);
    invoice.deposits = deposits;
    invoice.save();
  }
}

export function handleTransfer(event: TransferEvent): void {
  let invoice = Invoice.load(event.params.to.toHexString());
  if (invoice != null) {
    if (event.address.toHexString() === invoice.token.toHexString()) {
      invoice = updateInvoiceInfo(event.params.to, invoice);

      let deposit = new Deposit(event.transaction.hash.toHexString());
      deposit.invoice = invoice.id;
      deposit.sender = event.params.from;
      deposit.amount = event.params.tokens;
      deposit.timestamp = event.block.timestamp;
      deposit.save();

      let deposits = invoice.deposits;
      deposits.push(deposit.id);
      invoice.deposits = deposits;
      invoice.save();
    }
  }
}

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

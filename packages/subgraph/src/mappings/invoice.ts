import { log, Bytes } from '@graphprotocol/graph-ts';
import {
  Invoice,
  Release,
  Withdraw,
  Dispute,
  Resolution,
  Deposit,
} from '../types/schema';

import {
  Release as ReleaseEvent,
  Withdraw as WithdrawEvent,
  Lock as LockEvent,
  Resolve as ResolveEvent,
  Rule as RuleEvent,
  Deposit as DepositEvent,
} from '../types/templates/SmartInvoice/SmartInvoice';
import { addQm, updateInvoiceInfo } from './helpers';

export function handleRelease(event: ReleaseEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleRelease {}', [event.address.toHexString()]);
    invoice = updateInvoiceInfo(event.address, invoice);

    let release = new Release(event.logIndex.toHexString());
    release.txHash = event.transaction.hash;
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

    let withdraw = new Withdraw(event.logIndex.toHexString());
    withdraw.txHash = event.transaction.hash;
    withdraw.invoice = invoice.id;
    withdraw.amount = event.params.balance;
    withdraw.timestamp = event.block.timestamp;
    withdraw.save();

    let withdraws = invoice.withdraws;
    withdraws.push(withdraw.id);
    invoice.withdraws = withdraws;
    invoice.save();
  }
}

export function handleLock(event: LockEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, invoice);

    let dispute = new Dispute(event.logIndex.toHexString());
    dispute.txHash = event.transaction.hash;

    dispute.invoice = event.address.toHexString();
    dispute.sender = event.params.sender;
    dispute.details = event.params.details;
    let hexHash = changetype<Bytes>(addQm(dispute.details));
    let base58Hash = hexHash.toBase58();
    dispute.ipfsHash = base58Hash.toString();
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

    let resolution = new Resolution(event.logIndex.toHexString());
    resolution.txHash = event.transaction.hash;
    resolution.details = event.params.details;
    let hexHash = changetype<Bytes>(addQm(resolution.details));
    let base58Hash = hexHash.toBase58();
    resolution.ipfsHash = base58Hash.toString();
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

    let deposit = new Deposit(event.logIndex.toHexString());
    deposit.txHash = event.transaction.hash;
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

export function handleRule(event: RuleEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    invoice = updateInvoiceInfo(event.address, invoice);

    let resolution = new Resolution(event.logIndex.toHexString());
    resolution.txHash = event.transaction.hash;
    let hexHash = changetype<Bytes>(addQm(resolution.details));
    let base58Hash = hexHash.toBase58();
    resolution.ipfsHash = base58Hash.toString();
    resolution.resolverType = invoice.resolverType;
    resolution.resolver = invoice.resolver;
    resolution.invoice = invoice.id;
    resolution.clientAward = event.params.clientAward;
    resolution.providerAward = event.params.providerAward;
    resolution.timestamp = event.block.timestamp;
    resolution.ruling = event.params.ruling;
    resolution.save();

    let resolutions = invoice.resolutions;
    resolutions.push(resolution.id);
    invoice.resolutions = resolutions;
    invoice.save();
  }
}

import { log, Bytes } from '@graphprotocol/graph-ts';
import {
  Invoice,
  Release,
  Withdraw,
  Dispute,
  Resolution,
  Deposit,
  Verified,
  MilestonesAdded,
  Tip,
} from '../../types/schema';

import {
  UpdatedClient as UpdatedClientEvent,
  UpdatedProvider as UpdatedProviderEvent,
  UpdatedClientReceiver as UpdatedClientReceiverEvent,
  UpdatedProviderReceiver as UpdatedProviderReceiverEvent,
} from '../../types/templates/SmartInvoiceUpdatableV201/SmartInvoiceUpdatableV201';

import {
  Release as ReleaseEvent,
  Withdraw as WithdrawEvent,
  Lock as LockEvent,
  Resolve as ResolveEvent,
  Rule as RuleEvent,
  Deposit as DepositEvent,
  Verified as VerifiedEvent,
  MilestonesAdded as MilestonesAddedEvent,
} from '../../types/templates/SmartInvoiceEscrow01/SmartInvoiceEscrow01';

import {
  Tip as TipEvent,
  Fulfilled as FulfilledEvent,
} from '../../types/templates/SmartInvoiceInstant01/SmartInvoiceInstant01';

import { updateInvoice } from './utils';
import { addQm } from './utils';

export function handleMilestonesAdded(event: MilestonesAddedEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleMilestonesAdded {}', [event.address.toHexString()]);
    invoice = updateInvoice(event.address, invoice);

    let addition = new MilestonesAdded(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toHexString()),
    );
    addition.sender = event.params.sender;
    addition.invoice = event.params.invoice;
    addition.milestones = event.params.milestones;

    addition.save();

    let invoiceAmounts = invoice.amounts;

    let newEventMilestones = addition.milestones;
    let newAmounts = invoiceAmounts.concat(newEventMilestones);

    let milestonesAdded = invoice.milestonesAdded;
    milestonesAdded.push(addition.id);

    let invoiceTotal = invoice.total;
    for (let i = 0; i < newAmounts.length; i++) {
      invoiceTotal.plus(newAmounts[i]);
    }

    invoice.total = invoiceTotal;
    invoice.numMilestones += newEventMilestones.length;
    invoice.amounts = newAmounts;
    invoice.milestonesAdded = milestonesAdded;

    invoice.save();
  }
}

export function handleVerified(event: VerifiedEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleVerified {}', [event.address.toHexString()]);
    invoice = updateInvoice(event.address, invoice);

    let verification = new Verified(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toHexString()),
    );
    verification.client = event.params.client;
    verification.invoice = event.params.invoice;

    verification.save();

    let verified = invoice.verified;
    verified.push(verification.id);
    invoice.verified = verified;
    invoice.save();
  }
}

export function handleRelease(event: ReleaseEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleRelease {}', [event.address.toHexString()]);
    invoice = updateInvoice(event.address, invoice);

    let release = new Release(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toHexString()),
    );
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
    invoice = updateInvoice(event.address, invoice);

    let withdraw = new Withdraw(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toHexString()),
    );
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
    invoice = updateInvoice(event.address, invoice);

    let dispute = new Dispute(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toHexString()),
    );
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
    invoice = updateInvoice(event.address, invoice);

    let resolution = new Resolution(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toHexString()),
    );
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
    invoice = updateInvoice(event.address, invoice);

    let deposit = new Deposit(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toHexString()),
    );
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
    invoice = updateInvoice(event.address, invoice);

    let resolution = new Resolution(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toHexString()),
    );
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

// Instant Specific Events

export function handleTip(event: TipEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleTip {}', [event.address.toHexString()]);
    invoice = updateInvoice(event.address, invoice);

    let tip = new Tip(
      event.transaction.hash
        .toHexString()
        .concat('-')
        .concat(event.logIndex.toHexString()),
    );
    tip.sender = event.params.sender;
    tip.amount = event.params.amount;

    tip.save();

    let tipped = invoice.tipAmount;
    if (tipped !== null) {
      tipped.push(tip.id);
      invoice.tipAmount = tipped;
      invoice.save();
    }
  }
}

export function handleFulfilled(event: FulfilledEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleFulfilled {}', [event.address.toHexString()]);
    invoice = updateInvoice(event.address, invoice);

    let completed = invoice.fulfilled;
    completed = true;
    invoice.fulfilled = completed;
    invoice.save();
  }
}

export function handleUpdatedClient(event: UpdatedClientEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleUpdatedClient {}', [event.address.toHexString()]);
    invoice = updateInvoice(event.address, invoice);
    invoice.save();
  }
}

export function handleUpdatedProvider(event: UpdatedProviderEvent): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleUpdatedProvider {}', [event.address.toHexString()]);
    invoice = updateInvoice(event.address, invoice);
    invoice.save();
  }
}

export function handleUpdatedClientReceiver(
  event: UpdatedClientReceiverEvent,
): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleUpdatedClientReceiver {}', [event.address.toHexString()]);
    invoice = updateInvoice(event.address, invoice);
    invoice.save();
  }
}

export function handleUpdatedProviderReceiver(
  event: UpdatedProviderReceiverEvent,
): void {
  let invoice = Invoice.load(event.address.toHexString());
  if (invoice != null) {
    log.info('handleUpdatedProviderReceiver {}', [event.address.toHexString()]);
    invoice = updateInvoice(event.address, invoice);
    invoice.save();
  }
}

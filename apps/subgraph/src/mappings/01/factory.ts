import { log, dataSource, Address } from '@graphprotocol/graph-ts';
import { Invoice } from '../../types/schema';

import { LogNewInvoice as LogNewInvoiceEvent } from '../../types/SmartInvoiceFactory01/SmartInvoiceFactory01';
import {
  ERC20,
  SmartInvoiceEscrow01,
  SmartInvoiceInstant01,
  SmartInvoiceSplitEscrow01,
  SmartInvoiceUpdatable01,
  SmartInvoiceUpdatableV201,
} from '../../types/templates';
import { getToken } from './helpers/token';
import { updateInvoice } from './utils';

export function handleLogNewInvoice(event: LogNewInvoiceEvent): void {
  if (
    event.params.invoice.toHexString() ==
    '0x47838384f6cc2b08d5c86a2b48cdcb9d40516189'
  ) {
    return;
  }

  let invoice = new Invoice(event.params.invoice.toHexString());

  log.info('handleLogNewInvoice {}', [event.params.invoice.toHexString()]);

  invoice.address = event.params.invoice;
  invoice.factoryAddress = event.address;
  invoice.amounts = event.params.amounts;
  invoice.invoiceType = event.params.invoiceType.toString();
  invoice.version = event.params.version;
  invoice.numMilestones = event.params.amounts.length;
  invoice.createdAt = event.block.timestamp;
  invoice.deposits = new Array<string>();
  invoice.withdraws = new Array<string>();
  invoice.releases = new Array<string>();
  invoice.disputes = new Array<string>();
  invoice.resolutions = new Array<string>();
  invoice.creationTxHash = event.transaction.hash;
  invoice.network = dataSource.network();
  invoice.projectAgreement = new Array<string>();
  invoice.verified = new Array<string>();
  invoice.milestonesAdded = new Array<string>();
  invoice.tipAmount = new Array<string>();

  log.info('invoice type check {}', [invoice.invoiceType!.toString()]);

  invoice = updateInvoice(event.params.invoice, invoice);

  if (invoice.invoiceType == 'escrow') {
    SmartInvoiceEscrow01.create(event.params.invoice);
  } else if (invoice.invoiceType == 'split-escrow') {
    SmartInvoiceSplitEscrow01.create(event.params.invoice);
  } else if (invoice.invoiceType == 'updatable') {
    SmartInvoiceUpdatable01.create(event.params.invoice);
  } else if (invoice.invoiceType == 'updatable-v2') {
    SmartInvoiceUpdatableV201.create(event.params.invoice);
  } else if (invoice.invoiceType == 'instant') {
    SmartInvoiceInstant01.create(event.params.invoice);
  }

  let tokenAddress = changetype<Address>(
    Address.fromHexString(invoice.token.toHexString()),
  );
  let token = getToken(tokenAddress);
  token.save();
  ERC20.create(tokenAddress);

  invoice.tokenMetadata = tokenAddress.toHexString();
  invoice.save();
}

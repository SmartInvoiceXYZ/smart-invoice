import { log, dataSource, Address, Bytes } from '@graphprotocol/graph-ts';
import { Invoice, Agreement } from '../../types/schema';

import { LogNewInvoice as LogNewInvoiceEvent } from '../../types/SmartInvoiceFactoryVersion01/SmartInvoiceFactory01';
import { ERC20 } from '../../types/templates';
import { getToken } from './helpers/token';
import { updateInvoice } from './utils';

export function handleLogNewInvoice(event: LogNewInvoiceEvent): void {
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

  let tokenAddress = changetype<Address>(
    Address.fromHexString(invoice.token.toHexString()),
  );
  let token = getToken(tokenAddress);
  token.save();
  ERC20.create(tokenAddress);

  invoice.tokenMetadata = tokenAddress.toHexString();
  invoice.save();
}

import { log, dataSource, Address } from '@graphprotocol/graph-ts';
import { Invoice } from '../types/schema';

import { LogNewInvoice as LogNewInvoiceEvent } from '../types/SmartInvoiceFactoryVersion00/SmartInvoiceFactory';
import { ERC20, SmartInvoice } from '../types/templates';
import { updateInvoiceInfo, getToken } from './helpers';

export function handleLogNewInvoice(event: LogNewInvoiceEvent): void {
  let invoice = new Invoice(event.params.invoice.toHexString());

  log.info('handleLogNewInvoice {}', [event.params.invoice.toHexString()]);

  invoice.address = event.params.invoice;
  invoice.factoryAddress = event.address;
  invoice.amounts = event.params.amounts;
  invoice.numMilestones = event.params.amounts.length;
  invoice.createdAt = event.block.timestamp;
  invoice.deposits = new Array<string>();
  invoice.withdraws = new Array<string>();
  invoice.releases = new Array<string>();
  invoice.disputes = new Array<string>();
  invoice.resolutions = new Array<string>();
  invoice.creationTxHash = event.transaction.hash;
  invoice.network = dataSource.network();

  invoice = updateInvoiceInfo(event.params.invoice, invoice);

  SmartInvoice.create(event.params.invoice);

  let tokenAddress = Address.fromHexString(
    invoice.token.toHexString(),
  ) as Address;
  let token = getToken(tokenAddress);
  token.save();
  ERC20.create(tokenAddress);

  invoice.tokenMetadata = tokenAddress.toHexString();
  invoice.save();
}

import { log } from '@graphprotocol/graph-ts';
import { Invoice, Deposit } from '../types/schema';
import { Transfer as TransferEvent } from '../types/templates/ERC20/ERC20';

import { updateInvoiceInfo } from './01/helpers';

export function handleTransfer(event: TransferEvent): void {
  let invoice = Invoice.load(event.params.to.toHexString());
  if (invoice != null) {
    log.info('handleTransfer {} Invoice Found {}', [
      event.transaction.hash.toHexString(),
      invoice.id,
    ]);
    if (event.address == invoice.token) {
      log.info('handleTransfer {} Invoice {} Token Found {}', [
        event.transaction.hash.toHexString(),
        invoice.id,
        invoice.token.toHexString(),
      ]);
      invoice = updateInvoiceInfo(event.params.to, invoice);

      let deposit = new Deposit(event.logIndex.toHexString());
      deposit.txHash = event.transaction.hash;
      deposit.invoice = invoice.id;
      deposit.sender = event.params.from;
      deposit.amount = event.params.amount;
      deposit.timestamp = event.block.timestamp;
      deposit.save();

      let deposits = invoice.deposits;
      deposits.push(deposit.id);
      invoice.deposits = deposits;
      invoice.save();
    }
  }
}

import {
  Address,
  ethereum,
  JSONValue,
  Value,
  ipfs,
  json,
  Bytes,
  Entity,
} from '@graphprotocol/graph-ts';

// import { newMockEvent } from 'matchstick-as/assembly/index';

import { Verified } from '../types/templates/SmartInvoice/SmartInvoice';
import { newMockEvent } from './matchstick-as/assembly';

export function createNewVerifyEvent(
  client: string,
  invoice: string,
): Verified {
  let newVerifyEvent = changetype<Verified>(newMockEvent());
  newVerifyEvent.parameters = new Array();
  let clientParam = new ethereum.EventParam(
    'client',
    ethereum.Value.fromAddress(Address.fromString(client)),
  );
  let invoiceParam = new ethereum.EventParam(
    'invoice',
    ethereum.Value.fromAddress(Address.fromString(invoice)),
  );

  newVerifyEvent.parameters.push(clientParam);
  newVerifyEvent.parameters.push(invoiceParam);

  return newVerifyEvent;
}

import {
  Address,
  ethereum,
  JSONValue,
  Value,
  ipfs,
  json,
  Bytes,
} from '@graphprotocol/graph-ts';

// import { newMockEvent } from 'matchstick-as/assembly/index';

import { Verified } from '../types/schema';
import { handleVerification } from '../mappings/invoice';
import { newMockEvent } from './matchstick-as/assembly';

export function createNewVerifyEvent(
  client: string,
  invoice: string,
): Verified {
  let newVerificationEvent = newMockEvent();
  newVerificationEvent.parameters = new Array();
  let idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));

  let addressParam = new ethereum.EventParam(
    'client',
    ethereum.Value.fromAddress(Address.fromString(client)),
  );

  let displayNameParam = new ethereum.EventParam(
    'invoice',
    ethereum.Value.fromAddress(Address.fromString(invoice)),
  );

  newVerificationEvent.parameters.push(idParam);
  newVerificationEvent.parameters.push(client);
  newVerificationEvent.parameters.push(invoice);

  return newVerificationEvent;
}

import {
  Address,
  ethereum,
  JSONValue,
  Value,
  ipfs,
  json,
  Bytes,
} from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as/assembly/index';

// import { Gravatar } from "../../generated/schema"
import { NewVerificationEvent } from '../../generated/Gravity/Gravity';
import { handleVerification } from '../src/mappings/invoice';

export function createNewVerifyEvent(
  id: 1,
  ownerAddress: string,
  displayName: string,
  imageUrl: string,
): NewVerificationEvent {
  let newVerificationEvent = changetype<NewVerificationEvent>(newMockEvent());
  newVerificationEvent.parameters = new Array();
  let idParam = new ethereum.EventParam('id', ethereum.Value.fromI32(id));
  let addressParam = new ethereum.EventParam(
    'ownderAddress',
    ethereum.Value.fromAddress(Address.fromString(ownerAddress)),
  );
  let displayNameParam = new ethereum.EventParam(
    'displayName',
    ethereum.Value.fromString(displayName),
  );
  let imageUrlParam = new ethereum.EventParam(
    'imageUrl',
    ethereum.Value.fromString(imageUrl),
  );

  newVerificationEvent.parameters.push(idParam);
  newVerificationEvent.parameters.push(addressParam);
  newVerificationEvent.parameters.push(displayNameParam);
  newVerificationEvent.parameters.push(imageUrlParam);

  return newVerificationEvent;
}

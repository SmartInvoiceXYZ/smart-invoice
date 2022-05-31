import {
  assert,
  createMockedFunction,
  clearStore,
  test,
  newMockEvent,
  newMockCall,
  countEntities,
  mockIpfsFile,
} from 'matchstick-as/assembly/index';
import {
  Address,
  BigInt,
  Bytes,
  ethereum,
  store,
  Value,
  ipfs,
} from '@graphprotocol/graph-ts';

import { createNewVerifyEvent } from './utils';
// import { Gravatar } from "../../generated/schema"
// import { Gravity, NewGravatar, CreateGravatarCall } from "../../generated/Gravity/Gravity"
// import { handleCreateGravatar, handleNewGravatar } from "../../src/gravity"

// let GRAVATAR_ENTITY_TYPE = "Gravatar"
// let TRANSACTION_ENTITY_TYPE = "Transaction"

test('Can handle Verification Event', () => {
  let newVerificationEvent = createNewVerifyEvent();
});

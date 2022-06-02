import {
  assert,
  createMockedFunction,
  clearStore,
  test,
  newMockEvent,
  newMockCall,
  countEntities,
  mockIpfsFile,
} from './matchstick-as/assembly/index';
import {
  Address,
  BigInt,
  Bytes,
  ethereum,
  store,
  Value,
  ipfs,
} from '@graphprotocol/graph-ts';

import { handleVerification } from '../mappings/invoice';
import { createNewVerifyEvent } from './utils';
import { Verified } from '../types/schema';
// import { Gravatar } from "../../generated/schema"
// import { Gravity, NewGravatar, CreateGravatarCall } from "../../generated/Gravity/Gravity"
// import { handleCreateGravatar, handleNewGravatar } from "../../src/gravity"

// let GRAVATAR_ENTITY_TYPE = "Gravatar"
// let TRANSACTION_ENTITY_TYPE = "Transaction"

test('Can handle Verification Event', () => {
  let verify = new Verified('1');
  verify.save();

  // let newVerificationEvent = createNewVerifyEvent('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266','0xb35Pd6e51aad88F6F4ce6aB8827279cffFb92266');

  let newVerificationEvent = createNewVerifyEvent(
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
  );

  handleVerification(newVerificationEvent);

  // fieldEquals(entityType: string, id: string, fieldName: string, expectedValue: string)

  assert.fieldEquals(
    'Verified',
    '1',
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0xb35Pd6e51aad88F6F4ce6aB8827279cffFb92266',
  );
});

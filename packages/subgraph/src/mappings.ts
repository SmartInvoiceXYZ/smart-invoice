import { Bytes, log } from '@graphprotocol/graph-ts';

import { Invoice } from '../generated/schema';

import {
  Register,
  Deposit,
  Release,
  Withdraw,
  Lock,
  Resolve,
  Rule,
} from '../generated/SmartInvoiceMono/SmartInvoiceMono';

export function handleRegister(event: Register): void {}

export function handleDeposit(event: Deposit): void {}

export function handleRelease(event: Release): void {}

export function handleWithdraw(event: Withdraw): void {}

export function handleLock(event: Lock): void {}

export function handleResolve(event: Resolve): void {}

export function handleRule(event: Rule): void {}

import {
  LOG_TYPE,
  SMART_INVOICE_FACTORY_ABI,
  SMART_INVOICE_INSTANT_ABI,
  SMART_INVOICE_SPLIT_ESCROW_ABI,
  SMART_INVOICE_UPDATEABLE_ABI,
} from '@smartinvoicexyz/constants';
import { ValueOf } from '@smartinvoicexyz/types';
import _ from 'lodash';
import {
  decodeEventLog,
  DecodeEventLogReturnType,
  Log,
  TransactionReceipt,
  WaitForTransactionReceiptReturnType,
} from 'viem';

type KnownAbi =
  | typeof SMART_INVOICE_FACTORY_ABI
  | typeof SMART_INVOICE_INSTANT_ABI
  | typeof SMART_INVOICE_SPLIT_ESCROW_ABI
  | typeof SMART_INVOICE_UPDATEABLE_ABI;

type LogParserFunction = (
  _log: Log,
) => DecodeEventLogReturnType<KnownAbi> | undefined;

const logParserFactory = (abi: KnownAbi) => (log: Log) => {
  try {
    return decodeEventLog({
      abi,
      data: log?.data,
      topics: log?.topics,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`error parsing log:`, e);
    return undefined;
  }
};

export const logParser: {
  [key: ValueOf<typeof LOG_TYPE>]: LogParserFunction;
} = {
  Factory: logParserFactory(SMART_INVOICE_FACTORY_ABI),
  Instant: logParserFactory(SMART_INVOICE_INSTANT_ABI),
  Split: logParserFactory(SMART_INVOICE_SPLIT_ESCROW_ABI),
  Updatable: logParserFactory(SMART_INVOICE_UPDATEABLE_ABI),
};

export const parseTxLogs = (
  type: ValueOf<typeof LOG_TYPE>,
  txData: TransactionReceipt | WaitForTransactionReceiptReturnType,
  eventName: string,
  key: string, // eventLog.args.key
) => {
  const { logs } = txData;
  if (!logParser[type]) return undefined;
  // parse logs for ABI
  const parsedLogs = _.map(logs, log => {
    const parsedLog = logParser[type]?.(log);
    return parsedLog;
  });
  // lookup event by name
  const parsedEvent = _.find(parsedLogs, { eventName });
  // find data by provided key
  return _.get(parsedEvent, `args.${key}`);
};

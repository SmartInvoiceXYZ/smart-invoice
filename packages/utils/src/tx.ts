import {
  LOG_TYPE,
  SMART_INVOICE_ESCROW_ABI,
  SMART_INVOICE_FACTORY_ABI,
  SMART_INVOICE_INSTANT_ABI,
  SMART_INVOICE_SPLIT_ESCROW_ABI,
} from '@smartinvoicexyz/constants';
import { ValueOf } from '@smartinvoicexyz/types';
import _ from 'lodash';
import {
  decodeEventLog,
  DecodeEventLogReturnType,
  Log,
  TransactionReceipt,
} from 'viem';

export const logParser: {
  [key: ValueOf<typeof LOG_TYPE>]: (
    _log: Log,
  ) => DecodeEventLogReturnType | undefined;
} = {
  Factory: (log: Log) => {
    try {
      return decodeEventLog({
        abi: SMART_INVOICE_FACTORY_ABI,
        data: log?.data,
        topics: log?.topics,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('error', e);
      return undefined;
    }
  },
  Escrow: (log: Log) =>
    decodeEventLog({
      abi: SMART_INVOICE_ESCROW_ABI,
      data: log?.data,
      topics: log?.topics,
    }),

  Instant: (log: Log) =>
    decodeEventLog({
      abi: SMART_INVOICE_INSTANT_ABI,
      data: log?.data,
      topics: log?.topics,
    }),
  Split: (log: Log) =>
    decodeEventLog({
      abi: SMART_INVOICE_SPLIT_ESCROW_ABI,
      data: log?.data,
      topics: log?.topics,
    }),
  Updatable: (log: Log) =>
    decodeEventLog({
      abi: SMART_INVOICE_FACTORY_ABI,
      data: log?.data,
      topics: log?.topics,
    }),
};

export const parseTxLogs = (
  type: ValueOf<typeof LOG_TYPE>,
  txData: TransactionReceipt,
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

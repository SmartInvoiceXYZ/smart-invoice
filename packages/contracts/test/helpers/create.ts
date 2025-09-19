import {
  getAddress,
  GetTransactionReceiptReturnType,
  Hex,
  parseAbi,
  parseEventLogs,
} from 'viem';

export const awaitInvoiceAddress = async (
  receipt: GetTransactionReceiptReturnType,
): Promise<Hex | null> => {
  if (!receipt || !receipt.logs) return null;

  const abi = parseAbi([
    'event InvoiceCreated(uint256 indexed id, address indexed invoice, uint256[] amounts, bytes32 invoiceType, uint256 version)',
  ]);

  const logs = parseEventLogs({ abi, logs: receipt.logs });
  const event = logs.find(log => log.eventName === 'InvoiceCreated');

  if (event) {
    return getAddress(event.args.invoice);
  }
  return null;
};

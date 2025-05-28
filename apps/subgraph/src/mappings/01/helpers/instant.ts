import { Address, log } from '@graphprotocol/graph-ts';

import { Invoice } from '../../../types/schema';
import { SmartInvoiceInstant01 } from '../../../types/templates/SmartInvoiceInstant01/SmartInvoiceInstant01';
import { InvoiceObject } from '../utils';
import { handleIpfsDetails } from './ipfs';

function fetchInstantInfo(address: Address): InvoiceObject {
  let invoiceInstance = SmartInvoiceInstant01.bind(address);

  let invoiceObject = new InvoiceObject();

  let client = invoiceInstance.try_client();
  let provider = invoiceInstance.try_provider();
  let token = invoiceInstance.try_token();
  let total = invoiceInstance.try_total();
  let details = invoiceInstance.try_details();
  let lateFee = invoiceInstance.try_lateFee();
  let lateFeeTimeInterval = invoiceInstance.try_lateFeeTimeInterval();
  let deadline = invoiceInstance.try_deadline();
  let fulfilled = invoiceInstance.try_fulfilled();

  if (!client.reverted) {
    invoiceObject.client = client.value;
  }
  if (!provider.reverted) {
    invoiceObject.provider = provider.value;
  }
  if (!token.reverted) {
    invoiceObject.token = token.value;
  }
  if (!total.reverted) {
    invoiceObject.total = total.value;
  }
  if (!lateFee.reverted) {
    invoiceObject.lateFee = lateFee.value;
  }
  if (!lateFeeTimeInterval.reverted) {
    invoiceObject.lateFeeTimeInterval = lateFeeTimeInterval.value;
  }
  if (!deadline.reverted) {
    invoiceObject.deadline = deadline.value;
  }
  if (!fulfilled.reverted) {
    invoiceObject.fulfilled = fulfilled.value;
  }
  if (!details.reverted) {
    invoiceObject = handleIpfsDetails(details.value, invoiceObject);
  }

  return invoiceObject;
}

export function updateInstantInfo(address: Address, invoice: Invoice): Invoice {
  let invoiceObject = fetchInstantInfo(address);

  log.info('Got details for invoice', [address.toHexString()]);

  invoice.token = invoiceObject.token;
  invoice.client = invoiceObject.client;
  invoice.provider = invoiceObject.provider;
  if (invoiceObject.resolverType == 0) {
    invoice.resolverType = 'individual';
  } else if (invoiceObject.resolverType == 1) {
    invoice.resolverType = 'arbitrator';
  }
  invoice.resolver = invoiceObject.resolver;
  invoice.resolutionRate = invoiceObject.resolutionRate;
  invoice.isLocked = invoiceObject.isLocked;
  invoice.currentMilestone = invoiceObject.currentMilestone;
  invoice.total = invoiceObject.total;
  invoice.released = invoiceObject.released;
  invoice.terminationTime = invoiceObject.terminationTime;
  invoice.details = invoiceObject.details;
  invoice.ipfsHash = invoiceObject.ipfsHash;
  invoice.disputeId = invoiceObject.disputeId;
  invoice.projectName = invoiceObject.projectName;
  invoice.projectDescription = invoiceObject.projectDescription;
  invoice.startDate = invoiceObject.startDate;
  invoice.endDate = invoiceObject.endDate;
  invoice.lateFee = invoiceObject.lateFee;
  invoice.lateFeeTimeInterval = invoiceObject.lateFeeTimeInterval;
  invoice.deadline = invoiceObject.deadline;
  invoice.fulfilled = invoiceObject.fulfilled;

  invoice.projectAgreement.length = 0;
  let projectAgreement = new Array<string>();
  let sourceAgreements = invoiceObject.projectAgreement;

  for (let i = 0; i < sourceAgreements.length; i++) {
    projectAgreement[i] = sourceAgreements[i].id;
  }

  invoice.projectAgreement = projectAgreement;

  return invoice as Invoice;
}

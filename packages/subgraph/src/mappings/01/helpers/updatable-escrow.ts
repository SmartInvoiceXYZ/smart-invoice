import { Address, log } from '@graphprotocol/graph-ts';

import { Invoice } from '../../../types/schema';
import { InvoiceObject } from '../utils';
import { SmartInvoiceUpdatable01 } from '../../../types/templates/SmartInvoiceEscrow01/SmartInvoiceUpdatable01';
import { handleIpfsDetails } from './ipfs';

function fetchEscrowInfo(address: Address): InvoiceObject {
  let updatableInstance = SmartInvoiceUpdatable01.bind(address);

  let invoiceObject = new InvoiceObject();

  let client = updatableInstance.try_client();
  let provider = updatableInstance.try_provider();
  let providerReceiver = updatableInstance.try_providerReceiver();
  let resolverType = updatableInstance.try_resolverType();
  let resolver = updatableInstance.try_resolver();
  let resolutionRate = updatableInstance.try_resolutionRate();
  let token = updatableInstance.try_token();
  let locked = updatableInstance.try_locked();
  let milestone = updatableInstance.try_milestone();
  let total = updatableInstance.try_total();
  let released = updatableInstance.try_released();
  let terminationTime = updatableInstance.try_terminationTime();
  let details = updatableInstance.try_details();
  let disputeId = updatableInstance.try_disputeId();

  if (!client.reverted) {
    invoiceObject.client = client.value;
  }
  if (!provider.reverted) {
    invoiceObject.provider = provider.value;
  }
  if (!providerReceiver.reverted) {
    invoiceObject.providerReceiver = providerReceiver.value;
  }
  if (!resolverType.reverted) {
    invoiceObject.resolverType = resolverType.value;
  }
  if (!resolver.reverted) {
    invoiceObject.resolver = resolver.value;
  }
  if (!resolutionRate.reverted) {
    invoiceObject.resolutionRate = resolutionRate.value;
  }
  if (!token.reverted) {
    invoiceObject.token = token.value;
  }
  if (!locked.reverted) {
    invoiceObject.isLocked = locked.value;
  }
  if (!milestone.reverted) {
    invoiceObject.currentMilestone = milestone.value;
  }
  if (!total.reverted) {
    invoiceObject.total = total.value;
  }
  if (!released.reverted) {
    invoiceObject.released = released.value;
  }
  if (!terminationTime.reverted) {
    invoiceObject.terminationTime = terminationTime.value;
  }
  if (!disputeId.reverted) {
    invoiceObject.disputeId = disputeId.value;
  }
  if (!details.reverted) {
    //needs to be broken out based on invoice type
    invoiceObject = handleIpfsDetails(details.value, invoiceObject);
  }

  return invoiceObject;
}

export function updateUpdatableInfo(
  address: Address,
  invoice: Invoice,
): Invoice {
  let invoiceObject = fetchEscrowInfo(address);

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
  invoice.providerReceiver = invoiceObject.providerReceiver;

  invoice.projectAgreement.length = 0;
  let projectAgreement = new Array<string>();
  let sourceAgreements = invoiceObject.projectAgreement;

  for (let i = 0; i < sourceAgreements.length; i++) {
    projectAgreement[i] = sourceAgreements[i].id;
  }

  invoice.projectAgreement = projectAgreement;

  log.info('fox tango {}', [invoice.projectName.toString()]);

  return invoice as Invoice;
}

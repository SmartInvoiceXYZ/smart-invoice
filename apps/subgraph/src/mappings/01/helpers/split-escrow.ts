import { Address, log } from '@graphprotocol/graph-ts';

import { Invoice } from '../../../types/schema';
import { SmartInvoiceSplitEscrow01 } from '../../../types/templates/SmartInvoiceSplitEscrow01/SmartInvoiceSplitEscrow01';
import { InvoiceObject } from '../utils';
import { handleIpfsDetails } from './ipfs';

function fetchSplitEscrowInfo(address: Address): InvoiceObject {
  let invoiceInstance = SmartInvoiceSplitEscrow01.bind(address);

  let invoiceObject = new InvoiceObject();

  let client = invoiceInstance.try_client();
  let provider = invoiceInstance.try_provider();
  let resolverType = invoiceInstance.try_resolverType();
  let resolver = invoiceInstance.try_resolver();
  let resolutionRate = invoiceInstance.try_resolutionRate();
  let token = invoiceInstance.try_token();
  let locked = invoiceInstance.try_locked();
  let milestone = invoiceInstance.try_milestone();
  let total = invoiceInstance.try_total();
  let released = invoiceInstance.try_released();
  let terminationTime = invoiceInstance.try_terminationTime();
  let details = invoiceInstance.try_details();
  let disputeId = invoiceInstance.try_disputeId();
  let dao = invoiceInstance.try_dao();
  let daoFee = invoiceInstance.try_daoFee();

  if (!client.reverted) {
    invoiceObject.client = client.value;
  }
  if (!provider.reverted) {
    invoiceObject.provider = provider.value;
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
    invoiceObject = handleIpfsDetails(details.value, invoiceObject);
  }
  if (!dao.reverted) {
    invoiceObject.dao = dao.value;
  }
  if (!daoFee.reverted) {
    invoiceObject.daoFee = daoFee.value;
  }

  return invoiceObject;
}

export function updateSplitEscrowInfo(
  address: Address,
  invoice: Invoice,
): Invoice {
  let invoiceObject = fetchSplitEscrowInfo(address);

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
  invoice.dao = invoiceObject.dao;
  invoice.daoFee = invoiceObject.daoFee;

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

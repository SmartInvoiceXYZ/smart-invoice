import {
  Address,
  BigInt,
  Bytes,
  ByteArray,
  ipfs,
  json,
  log,
} from '@graphprotocol/graph-ts';

import { Invoice, Token, Agreement } from '../../../types/schema';
import { SmartInvoiceInstant01 } from '../../../types/templates/SmartInvoiceInstant01/SmartInvoiceInstant01';
import { ERC20 } from '../../../types/templates/ERC20/ERC20';
import { InvoiceObject, addQm } from '../utils';

function fetchInstantInfo(address: Address): InvoiceObject {
  let invoiceInstance = SmartInvoiceInstant01.bind(address);

  let invoiceObject = new InvoiceObject();

  let client = invoiceInstance.try_client();
  let provider = invoiceInstance.try_provider();
  let token = invoiceInstance.try_token();
  let total = invoiceInstance.try_total();
  let details = invoiceInstance.try_details();

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
  if (!details.reverted) {
    //needs to be broken out based on invoice type
    invoiceObject.details = details.value;
    if (details.value.length == 32) {
      let hexHash = changetype<Bytes>(addQm(invoiceObject.details));
      let base58Hash = hexHash.toBase58();
      invoiceObject.ipfsHash = base58Hash.toString();
      let ipfsData = ipfs.cat(base58Hash);
      if (ipfsData !== null) {
        log.info('IPFS details from hash {}, data {}', [
          base58Hash,
          ipfsData.toString(),
        ]);
        let data = json.fromBytes(ipfsData).toObject();
        let projectName = data.get('projectName');
        if (projectName != null && !projectName.isNull()) {
          invoiceObject.projectName = projectName.toString();
        }
        let projectDescription = data.get('projectDescription');
        if (projectDescription != null && !projectDescription.isNull()) {
          invoiceObject.projectDescription = projectDescription.toString();
        }
        let projectAgreement = data.get('projectAgreement');
        if (projectAgreement != null && !projectAgreement.isNull()) {
          let projectArray = projectAgreement.toArray();
          let agreementArray = new Array<Agreement>();

          for (let i = 0; i < projectArray.length; i++) {
            let obj = projectArray[i].toObject();
            let type = obj.get('type');
            let src = obj.get('src');
            let createdAt = obj.get('createdAt');
            if (type && src && createdAt != null) {
              let typeValue = type.toString();
              let srcValue = src.toString();
              let createdAtValue = BigInt.fromString(createdAt.toString());

              let agreement = new Agreement(createdAtValue.toString());

              agreement.type = typeValue;
              agreement.src = srcValue;
              agreement.createdAt = createdAtValue;

              log.info(
                'agreement commit: agreement.type {} agreement.src {} agreement.createdAt {} index {}',
                [
                  agreement.type,
                  agreement.src,
                  agreement.createdAt.toString(),
                  i.toString(),
                ],
              );

              agreement.save();

              agreementArray[i] = agreement;
            }
          }

          invoiceObject.projectAgreement = agreementArray;
        }
        let startDate = data.get('startDate');
        if (startDate != null && !startDate.isNull()) {
          invoiceObject.startDate = startDate.toBigInt();
        }
        let endDate = data.get('endDate');
        if (endDate != null && !endDate.isNull()) {
          invoiceObject.endDate = endDate.toBigInt();
        }
      } else {
        log.warning('could not get IPFS details from hash {}', [base58Hash]);
      }
    }
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

  invoice.projectAgreement.length = 0;
  let projectAgreement = new Array<string>();
  let sourceAgreements = invoiceObject.projectAgreement;

  for (let i = 0; i < sourceAgreements.length; i++) {
    projectAgreement[i] = sourceAgreements[i].id;
  }

  invoice.projectAgreement = projectAgreement;

  return invoice as Invoice;
}

export function getToken(address: Address): Token {
  let token = Token.load(address.toHexString());
  if (token == null) {
    token = new Token(address.toHexString());

    let erc20 = ERC20.bind(address);
    let nameValue = erc20.try_name();
    let symbolValue = erc20.try_symbol();
    let decimalsValue = erc20.try_decimals();

    token.name = nameValue.reverted ? '' : nameValue.value;
    token.symbol = symbolValue.reverted ? '' : symbolValue.value;
    token.decimals = decimalsValue.reverted ? 0 : decimalsValue.value;
  }
  return token as Token;
}

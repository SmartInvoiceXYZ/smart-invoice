import {
  Address,
  BigInt,
  Bytes,
  ByteArray,
  ipfs,
  json,
  log,
} from '@graphprotocol/graph-ts';

import { Invoice, Token, Agreement } from '../../types/schema';
import { SmartInvoiceEscrow01 } from '../../types/templates/SmartInvoiceEscrow01/SmartInvoiceEscrow01';
import { ERC20 } from '../../types/templates/ERC20/ERC20';

// Helper adding 0x12 and 0x20 to make the proper ipfs hash
// the returned bytes32 is so [0,31]
export function addQm(a: ByteArray): ByteArray {
  let out = new Uint8Array(34);
  out[0] = 0x12;
  out[1] = 0x20;
  for (let i = 0; i < 32; i++) {
    out[i + 2] = a[i];
  }
  return changetype<ByteArray>(out);
}

let zeroAddress = changetype<Address>(
  Address.fromHexString('0x0000000000000000000000000000000000000000'),
);

let zeroBytes = changetype<Bytes>(Bytes.fromHexString('0x'));

class InvoiceObject {
  client: Address;
  provider: Address;
  resolverType: i32;
  resolver: Address;
  resolutionRate: BigInt;
  token: Address;
  isLocked: boolean;
  currentMilestone: BigInt;
  total: BigInt;
  released: BigInt;
  terminationTime: BigInt;
  details: Bytes;
  ipfsHash: string;
  disputeId: BigInt;
  projectName: string;
  projectDescription: string;
  projectAgreement: Array<Agreement>;
  startDate: BigInt;
  endDate: BigInt;
  invoiceType: String;
  version: BigInt;

  constructor() {
    this.client = zeroAddress;
    this.provider = zeroAddress;
    this.resolverType = 0;
    this.resolver = zeroAddress;
    this.resolutionRate = BigInt.fromI32(0);
    this.token = zeroAddress;
    this.isLocked = false;
    this.currentMilestone = BigInt.fromI32(0);
    this.total = BigInt.fromI32(0);
    this.released = BigInt.fromI32(0);
    this.terminationTime = BigInt.fromI32(0);
    this.details = zeroBytes;
    this.ipfsHash = '';
    this.disputeId = BigInt.fromI32(0);
    this.projectName = '';
    this.projectDescription = '';
    this.projectAgreement = new Array<Agreement>();
    this.startDate = BigInt.fromI32(0);
    this.endDate = BigInt.fromI32(0);
    this.invoiceType = '';
    this.version = BigInt.fromI32(0);
  }
}

function fetchInvoiceInfo(address: Address): InvoiceObject {
  let invoiceInstance = SmartInvoiceEscrow01.bind(address);
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

export function updateInvoiceInfo(address: Address, invoice: Invoice): Invoice {
  let invoiceObject = fetchInvoiceInfo(address);
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

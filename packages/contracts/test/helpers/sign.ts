import { ContractTypesMap } from 'hardhat/types';
import {
  hashTypedData,
  Hex,
  TypedData,
  TypedDataDomain,
  WalletClient,
} from 'viem';

/**
 * Creates a multi-signature by concatenating individual signatures from multiple signers
 * @param domain EIP712 domain data
 * @param types EIP712 type definitions
 * @param data The data to sign
 * @param signers Array of wallet clients to create signatures from
 * @returns Concatenated signature bytes
 */
export async function multisig(
  domain: TypedDataDomain,
  types: TypedData,
  data: Record<string, string | number | boolean | Hex | bigint>,
  signers: WalletClient[],
): Promise<Hex> {
  let signature = '0x' as Hex;

  // eslint-disable-next-line no-restricted-syntax
  for (const signer of signers) {
    // eslint-disable-next-line no-await-in-loop
    const individualSignature = await signer.signTypedData({
      domain,
      types,
      primaryType: Object.keys(types)[0],
      message: data,
      account: signer.account!,
    });
    // Remove the '0x' prefix from subsequent signatures and concatenate
    signature = (signature + individualSignature.slice(2)) as Hex;
  }

  return signature;
}

export type UnlockData = {
  milestone: bigint;
  refundBPS: bigint;
  unlockURI: string;
};

/**
 * Helper function to create unlock signatures for testing
 * @param contract The escrow contract instance
 * @param refundBPS The refund basis points (0-10000)
 * @param unlockURI The URI for unlock details
 * @param signers Array of wallet clients (should be [client, provider])
 * @returns Promise resolving to concatenated signatures
 */
export async function createUnlockSignatures(
  contract:
    | ContractTypesMap['SmartInvoiceEscrowCore']
    | ContractTypesMap['SmartInvoiceEscrowPush'],
  unlockData: UnlockData,
  signers: WalletClient[],
): Promise<Hex> {
  // Get EIP712 domain info from contract
  const domainData = await contract.read.eip712Domain();
  // EIP712Domain returns: fields, name, version, chainId, verifyingContract, salt, extensions
  const [, name, version, chainId, verifyingContract] = domainData;

  const domain = {
    name,
    version,
    chainId: Number(chainId), // Convert bigint to number for viem
    verifyingContract,
  };

  const types = {
    UnlockData: [
      { name: 'milestone', type: 'uint256' },
      { name: 'refundBPS', type: 'uint256' },
      { name: 'unlockURI', type: 'string' },
    ],
  };

  return multisig(domain, types, unlockData, signers);
}

/**
 * Helper function to create an unlock hash for testing
 * @param contract The escrow contract instance
 * @param refundBPS The refund basis points (0-10000)
 * @param unlockURI The URI for unlock details
 * @returns Promise resolving to the EIP712 hash
 */
export async function createUnlockHash(
  contract:
    | ContractTypesMap['SmartInvoiceEscrowCore']
    | ContractTypesMap['SmartInvoiceEscrowPush'],
  unlockData: UnlockData,
): Promise<Hex> {
  // Get EIP712 domain info from contract
  const domainData = await contract.read.eip712Domain();
  // EIP712Domain returns: fields, name, version, chainId, verifyingContract, salt, extensions
  const [, name, version, chainId, verifyingContract] = domainData;

  const domain = {
    name,
    version,
    chainId: Number(chainId), // Convert bigint to number for viem
    verifyingContract,
  };

  const types = {
    UnlockData: [
      { name: 'milestone', type: 'uint256' },
      { name: 'refundBPS', type: 'uint256' },
      { name: 'unlockURI', type: 'string' },
    ],
  };

  return hashTypedData({
    domain,
    types,
    primaryType: 'UnlockData',
    message: unlockData,
  });
}

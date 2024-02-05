/* eslint-disable radix */
import {
  DEFAULT_CHAIN_ID,
  invoiceFactory,
  IPFS_ENDPOINT,
  isOfTypeChainId,
  resolverInfo,
  resolvers,
  SUPPORTED_NETWORKS,
  wrappedNativeToken,
} from '@smart-invoice/constants';
import { Invoice, TokenBalance, TokenMetadata } from '@smart-invoice/graphql';
import { ProjectAgreement } from '@smart-invoice/types';
import _ from 'lodash';
import { Address, formatUnits, Hex } from 'viem';

import { chainsMap } from '.';

export const unsupportedNetwork = (chainId: number) =>
  !_.includes(SUPPORTED_NETWORKS, chainId);

export const getResolvers = (chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? resolvers(chainId)
    : resolvers(DEFAULT_CHAIN_ID);

export const getResolverInfo = (resolver: Address, chainId?: number) =>
  chainId && isOfTypeChainId(chainId)
    ? resolverInfo(chainId)[_.toLower(resolver) as Hex]
    : resolverInfo(DEFAULT_CHAIN_ID)[_.toLower(resolver) as Hex];

export const getResolverFee = (
  invoice: Invoice,
  tokenBalance: TokenBalance,
) => {
  const { resolutionRate } = _.pick(invoice, ['resolutionRate']);

  return tokenBalance?.value && resolutionRate
    ? formatUnits(
        !resolutionRate || resolutionRate === BigInt(0)
          ? BigInt(0)
          : tokenBalance.value / BigInt(resolutionRate),
        18,
      )
    : undefined;
};

export const resolverFeeLabel = (
  fee: string | undefined,
  tokenMetadata: TokenMetadata | undefined,
) => (fee ? `${fee} ${tokenMetadata?.symbol}` : undefined);

export const getWrappedNativeToken = (chainId?: number) =>
  chainId && wrappedNativeToken(chainId);

export const getNativeTokenSymbol = (chainId?: number) =>
  chainId ? chainsMap(chainId)?.nativeCurrency : undefined;

export const getInvoiceFactoryAddress = (chainId: number) =>
  isOfTypeChainId(chainId)
    ? invoiceFactory(chainId)
    : invoiceFactory(DEFAULT_CHAIN_ID);

const getExplorerUrl = (chainId: number) => {
  const chain = chainsMap(chainId);
  return _.get(
    chain,
    'blockExplorers.etherscan.url',
    _.get(chain, 'blockExplorers.default.url'),
  );
};

export const getTxLink = (
  chainId: number | undefined,
  hash: string | undefined,
) => {
  if (!chainId || !hash) return '#';
  return `${getExplorerUrl(chainId)}/tx/${hash}`;
};

export const getAddressLink = (
  chainId: number | undefined,
  hash: string | undefined,
) => {
  if (!chainId || !hash) return '#';
  return `${getExplorerUrl(chainId)}/address/${hash}`;
};

// bytes58 QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51
// is the same as
// bytes64 12200000000000000000000000000000000000000000000000000000000000000000
// which means an all zeros bytes32 was input on the contract
export const getIpfsLink = (hash: string) =>
  hash === 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51'
    ? ''
    : `${IPFS_ENDPOINT}/ipfs/${hash}`;

export const getAccountString = (account?: string) => {
  if (!account) return undefined;
  const len = account.length;
  return `0x${_.toUpper(account.slice(2, 4))}...${_.toUpper(
    account.slice(len - 5, len),
  )}`;
};

export const isKnownResolver = (resolver: Address, chainId?: number) =>
  _.includes(getResolvers(chainId), _.toLower(resolver));

export const getResolverString = (resolver: Address, chainId?: number) => {
  const info = getResolverInfo(resolver, chainId);
  return info ? info.name : getAccountString(resolver);
};

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/;

export const isValidURL = (str: string) => !!URL_REGEX.test(str);

const BASE32_REGEX = /^[a-zA-Z2-7]+=*$/;
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+=*$/;

export const isValidCID = (hash: string) =>
  (hash.length === 59 &&
    hash.startsWith('bafy') &&
    !!BASE32_REGEX.test(hash)) ||
  (hash.length === 46 && hash.startsWith('Qm') && !!BASE58_REGEX.test(hash));

export const isValidLink = (url: string) => {
  if (!url) return false;
  if (url.startsWith('ipfs://')) {
    return isValidCID(url.slice(7));
  }
  return isValidURL(url);
};

export function commify(x: number | bigint | string): string {
  if (_.toString(x).includes('.')) {
    const [whole, decimal] = x.toString().split('.');
    return `${commify(whole)}.${decimal}`;
  }
  return _.toString(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const resolutionFeePercentage = (resolutionRate: string) => {
  const feePercentage = 1 / parseInt(resolutionRate);

  return feePercentage;
};

export const getAgreementLink = (
  projectAgreement: ProjectAgreement[] | undefined,
) => {
  if (_.isEmpty(projectAgreement)) return '';

  const address = _.get(
    _.nth(projectAgreement, _.size(projectAgreement) - 1),
    'src',
  );
  if (
    _.get(_.nth(projectAgreement, _.size(projectAgreement) - 1), 'type') ===
    'ipfs'
  ) {
    // address.substring(7) removes ipfs:// from the beginning of the src string
    const hash = address?.substring(7);
    const link = `${IPFS_ENDPOINT}/ipfs/${hash}`;
    return link;
  }
  return address;
};

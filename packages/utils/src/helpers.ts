import {
  ARWEAVE_ENDPOINT,
  invoiceFactory,
  IPFS_ENDPOINT,
  isSupportedChainId,
  KnownResolverType,
  Resolver,
  resolverInfo,
  resolvers,
  wrappedNativeToken,
} from '@smartinvoicexyz/constants';
import { Invoice, TokenBalance, TokenMetadata } from '@smartinvoicexyz/graphql';
import {
  Document,
  SupportedURL,
  SupportedURLType,
} from '@smartinvoicexyz/types';
import _ from 'lodash';
import { Address, formatUnits } from 'viem';

import { chainById } from './web3';

export const getResolverTypes = (
  chainId: number | undefined,
): Array<KnownResolverType> => {
  if (!isSupportedChainId(chainId)) return [];
  return resolvers(chainId);
};

export type ResolverInfo<T extends KnownResolverType | undefined> =
  T extends KnownResolverType ? Resolver : undefined;

export const getResolverInfo = <T extends KnownResolverType | undefined>(
  resolverType: T,
  chainId: number | undefined,
): ResolverInfo<T> => {
  if (!resolverType || !isSupportedChainId(chainId))
    return undefined as ResolverInfo<T>;

  return resolverInfo(chainId)[resolverType] as ResolverInfo<T>;
};

export const getResolverInfoByAddress = (
  resolverAddress: Address,
  chainId: number | undefined,
): Resolver | undefined => {
  if (!isSupportedChainId(chainId)) return undefined;
  const resolverTypes = getResolverTypes(chainId);
  return resolverTypes
    .map(resolverType => getResolverInfo(resolverType, chainId))
    .find(
      info => info?.address.toLowerCase() === resolverAddress.toLowerCase(),
    );
};

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

export const getWrappedNativeToken = (chainId: number | undefined) => {
  if (!isSupportedChainId(chainId)) return undefined;
  return wrappedNativeToken(chainId);
};

export const getNativeTokenSymbol = (chainId: number | undefined) => {
  if (!isSupportedChainId(chainId)) return undefined;
  return chainById(chainId).nativeCurrency.symbol;
};

export const getInvoiceFactoryAddress = (chainId: number | undefined) => {
  if (!isSupportedChainId(chainId)) return undefined;
  return invoiceFactory(chainId);
};

const getExplorerUrl = (chainId: number | undefined) => {
  if (!isSupportedChainId(chainId)) return '#';
  const chain = chainById(chainId);
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
const EMPTY_CID = 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51';

export const isEmptyIpfsHash = (hash: string) => hash === EMPTY_CID;

export const getAccountString = (account?: Address) => {
  if (!account) return undefined;
  const len = account.length;
  return `0x${_.toUpper(account.slice(2, 4))}...${_.toUpper(
    account.slice(len - 5, len),
  )}`;
};

export const isKnownResolver = (
  resolverType: KnownResolverType,
  chainId: number | undefined,
) => {
  if (!isSupportedChainId(chainId)) return false;
  return _.includes(getResolverTypes(chainId), _.toLower(resolverType));
};

export const isKnownResolverAddress = (
  resolverAddress: Address,
  chainId: number | undefined,
) =>
  _.some(
    getResolverTypes(chainId),
    resolverType =>
      getResolverInfo(resolverType, chainId)?.address.toLowerCase() ===
      resolverAddress.toLowerCase(),
  );

export const getResolverString = (
  resolverType: KnownResolverType,
  chainId: number | undefined,
  resolverAddress?: Address,
) => {
  const info = getResolverInfo(resolverType, chainId);
  return info ? info.name : getAccountString(resolverAddress);
};

const IPFS_HASH_REGEX =
  /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})([/?#][-a-zA-Z0-9@:%_+.~#?&//=]*)*$/;

const isValidCID = (hash: string) => IPFS_HASH_REGEX.test(hash);

const ARWEAVE_TXID_REGEX = /^([a-z0-9-_]{43})$/i;

const isValidArweaveTxID = (hash: string) => ARWEAVE_TXID_REGEX.test(hash);

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'ipfs:', 'ar:'];
export const PROTOCOL_OPTIONS = ['https://', 'ipfs://', 'ar://'];

export const isValidURL = (url: string | undefined): url is SupportedURL => {
  if (!url) return false;

  try {
    // Parse the URL
    const parsedUrl = new URL(url);

    // Check if the protocol is one of the allowed protocols
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return false;
    }

    if (parsedUrl.protocol === 'ipfs:') {
      return isValidCID(parsedUrl.href.slice(7));
    }

    if (parsedUrl.protocol === 'ar:') {
      return isValidArweaveTxID(parsedUrl.href.slice(5));
    }

    // Additional checks for valid formats, etc.
    return true;
  } catch {
    // If URL constructor throws, it's not a valid URL
    return false;
  }
};

export const getDecimals = (value: string) => {
  const [, decimal] = value.split('.');
  return decimal?.length || 0;
};

export function commify(
  x: number | bigint | string,
  decimals?: number,
): string {
  if (_.toString(x).includes('.')) {
    const [whole, decimal] = x.toString().split('.');
    return `${commify(whole)}.${decimal.substring(0, Math.min(decimals ?? decimal.length, decimal.length))}`;
  }
  return _.toString(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const resolutionFeePercentage = (resolutionRate: string): number => {
  if (!resolutionRate || resolutionRate === '0') {
    return 0;
  }
  const feePercentage = 1 / parseInt(resolutionRate, 10);

  return feePercentage;
};

export const uriToHttp = (uri: string | undefined): string => {
  if (!isValidURL(uri)) {
    return '';
  }

  const parsedUrl = new URL(uri);

  if (parsedUrl.protocol === 'ipfs:') {
    return `${IPFS_ENDPOINT}/ipfs/${parsedUrl.href.slice(7)}`;
  }

  if (parsedUrl.protocol === 'ar:') {
    return `${ARWEAVE_ENDPOINT}/${parsedUrl.href.slice(5)}`;
  }

  return parsedUrl.href;
};

export const getIpfsLink = (hash: string) => {
  if (!isValidCID(hash)) {
    return '';
  }
  return `${IPFS_ENDPOINT}/ipfs/${hash}`;
};

export const documentToHttp = (document: Document) => uriToHttp(document.src);

const protocolToType = (protocol: string): SupportedURLType => {
  switch (protocol) {
    case 'ipfs:':
      return 'ipfs';
    case 'ar:':
      return 'arweave';
    case 'https:':
    case 'http:':
    default:
      return 'https';
  }
};

export const uriToDocument = (
  uri: string | undefined,
): Document | undefined => {
  if (!isValidURL(uri)) {
    return undefined;
  }

  const parsed = new URL(uri);
  const now = Math.floor(new Date().getTime() / 1000);
  const type = protocolToType(parsed.protocol);

  return {
    id: parsed.hostname + parsed.pathname + now,
    src: uri as SupportedURL,
    type,
    createdAt: now,
  };
};

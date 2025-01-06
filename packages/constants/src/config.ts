import { toLower } from 'lodash';
import { Address, Chain, Hex } from 'viem';
import {
  arbitrum,
  base,
  gnosis,
  holesky,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'viem/chains';

export const INVOICE_VERSION = 'smart-invoice-v0.1.0';

export type KnownResolverType =
  | 'lexdao'
  | 'kleros'
  | 'smart-invoice'
  | 'custom';

type ResolverWithoutAddress = {
  id: KnownResolverType;
  name: string;
  logoUrl: string;
  disclaimer?: string;
  termsUrl: string;
};

type Tokens = {
  [key: string]: {
    decimals: number;
    address: Hex;
  };
};

export type Resolver = {
  address: Address;
} & ResolverWithoutAddress;

export type NetworkConfig = {
  SUBGRAPH: string;
  WRAPPED_NATIVE_TOKEN: Address;
  INVOICE_FACTORY: Address;
  RESOLVERS: Partial<Record<KnownResolverType, Resolver>>;
  TOKENS?: Tokens;
  ZAP_ADDRESS?: Hex;
  DAO_ADDRESS?: Hex;
  TREASURY_ADDRESS?: Hex;
  SPOILS_MANAGER?: Hex;
};

export type KlerosCourtData = {
  id: number;
  name: string;
  link: string;
  jurors_drawn: number;
  reward: string;
  safe_address: Address;
};

// @note: Kleros And Smart Invoice use the same safe address,
const SMART_INVOICE_ARBITRATION_SAFE = toLower(
  '0x18542245cA523DFF96AF766047fE9423E0BED3C0',
) as Address;

// https://github.com/lexDAO/Arbitration/blob/master/README.md#resolution-of-any-arbitration-request
const LEXDAO_ARBITRATION_SAFE = {
  [mainnet.id]: toLower(
    '0x5B620676E28693fC14876b035b08CbB1B657dF38',
  ) as Address,
  [arbitrum.id]: toLower(
    '0x2f3F50ACc51b240cFf2a452Af050Cc601d3Adccf',
  ) as Address,
  [polygon.id]: toLower(
    '0xf8DBd458f841424e2fD5fBDf18A7dEA17eb2211D',
  ) as Address,
  [gnosis.id]: toLower('0x153Fbf5da827903e030Dc317C4031755D74D508a') as Address,
};

export const KLEROS_GOOGLE_FORM = 'https://forms.gle/K3oMAzAb32G5SbpM9';

const LEXDAO_DATA: ResolverWithoutAddress = {
  id: 'lexdao',
  name: 'LexDAO',
  logoUrl: '/assets/lex-dao.png',
  termsUrl: 'https://docs.smartinvoice.xyz/arbitration/lexdao-arbitration',
};

const KLEROS_DATA: ResolverWithoutAddress = {
  id: 'kleros',
  name: 'Kleros',
  disclaimer:
    'Only choose Kleros if total invoice value is greater than 1000 USD',
  logoUrl: '/assets/kleros.svg',
  termsUrl: 'https://docs.smartinvoice.xyz/arbitration/kleros-arbitration',
};

const SMART_INVOICE_ARBITRATION_DATA: ResolverWithoutAddress = {
  id: 'smart-invoice',
  name: 'Smart Invoice In-house',
  disclaimer:
    'Only choose Smart Invoice In-house if invoice value is less than 1000 USD',
  logoUrl: '/favicon.ico',
  termsUrl:
    'https://docs.smartinvoice.xyz/arbitration/smart-invoice-arbitration',
};

export const KLEROS_COURTS: Array<KlerosCourtData> = [
  {
    id: 1,
    name: 'General Court',
    link: 'https://klerosboard.com/100/courts/0',
    jurors_drawn: 3,
    reward: '13 DAI/USDC per juror',
    safe_address: SMART_INVOICE_ARBITRATION_SAFE,
  },
  {
    id: 2,
    name: 'Solidity Court',
    link: 'https://klerosboard.com/100/courts/13',
    jurors_drawn: 2,
    reward: '30 DAI/USDC per juror',
    safe_address: SMART_INVOICE_ARBITRATION_SAFE,
  },
  {
    id: 3,
    name: 'Javascript Court',
    link: 'https://klerosboard.com/100/courts/14',
    jurors_drawn: 2,
    reward: '30 DAI/USDC per juror',
    safe_address: SMART_INVOICE_ARBITRATION_SAFE,
  },
];

const STUDIO_ID = '78711';

const getSubgraphUrl = (subgraphId: string, versionLabel: string) =>
  `https://api.studio.thegraph.com/query/${STUDIO_ID}/${subgraphId}/${versionLabel}`;

const chains: readonly [Chain, ...Chain[]] = [
  mainnet,
  gnosis,
  polygon,
  arbitrum,
  optimism,
  sepolia,
  base,
  holesky,
];

export const SUPPORTED_CHAIN_IDS = chains.map(chain => chain.id);
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];
export type SupportedChain = (typeof chains)[number];
export const SUPPORTED_CHAINS = chains as [SupportedChain, ...SupportedChain[]];

export const NETWORK_CONFIG: Record<SupportedChainId, NetworkConfig> = {
  [mainnet.id]: {
    SUBGRAPH: getSubgraphUrl('smart-invoice', 'v0.0.3'),
    WRAPPED_NATIVE_TOKEN: toLower(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0x5E14cF595e18F91170009946205f8BBa21b323ca',
    ) as Address,
    RESOLVERS: {
      lexdao: {
        address: LEXDAO_ARBITRATION_SAFE[mainnet.id],
        ...LEXDAO_DATA,
      },
      kleros: {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...KLEROS_DATA,
      },
      'smart-invoice': {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...SMART_INVOICE_ARBITRATION_DATA,
      },
    },
  },
  [gnosis.id]: {
    SUBGRAPH: getSubgraphUrl('smart-invoice-gnosis', 'v0.0.5'),
    WRAPPED_NATIVE_TOKEN: toLower(
      '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xdDd96D43b0B2Ca179DCefA58e71798d0ce56c9c8',
    ) as Address,
    RESOLVERS: {
      lexdao: {
        address: LEXDAO_ARBITRATION_SAFE[gnosis.id],
        ...LEXDAO_DATA,
      },
      kleros: {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...KLEROS_DATA,
      },
      'smart-invoice': {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...SMART_INVOICE_ARBITRATION_DATA,
      },
    },
  },
  [polygon.id]: {
    SUBGRAPH: getSubgraphUrl('smart-invoice-polygon', 'v0.0.3'),
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0x6dcF61a9170419f30e065A43540aa3663b837342',
    ) as Address,
    RESOLVERS: {
      lexdao: {
        address: LEXDAO_ARBITRATION_SAFE[polygon.id],
        ...LEXDAO_DATA,
      },
      kleros: {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...KLEROS_DATA,
      },
      'smart-invoice': {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...SMART_INVOICE_ARBITRATION_DATA,
      },
    },
  },
  [arbitrum.id]: {
    SUBGRAPH: getSubgraphUrl('smart-invoice-arbitrum', 'v0.0.3'),
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xb4CdeF4aa610C046864467592FaE456a58d3443a',
    ) as Address,
    RESOLVERS: {
      lexdao: {
        address: LEXDAO_ARBITRATION_SAFE[arbitrum.id],
        ...LEXDAO_DATA,
      },
      kleros: {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...KLEROS_DATA,
      },
      'smart-invoice': {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...SMART_INVOICE_ARBITRATION_DATA,
      },
    },
  },
  [optimism.id]: {
    SUBGRAPH: getSubgraphUrl('smart-invoice-optimism', 'v0.0.3'),
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x4200000000000000000000000000000000000006',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xF9822818143948237A60A1a1CEFC85D6F1b929Df',
    ) as Address,
    RESOLVERS: {
      kleros: {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...KLEROS_DATA,
      },
      'smart-invoice': {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...SMART_INVOICE_ARBITRATION_DATA,
      },
    },
  },
  [sepolia.id]: {
    SUBGRAPH: getSubgraphUrl('smart-invoice-sepolia', 'v0.0.3'),
    WRAPPED_NATIVE_TOKEN: toLower(
      '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0x8227b9868e00B8eE951F17B480D369b84Cd17c20',
    ) as Address,
    RESOLVERS: {
      kleros: {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...KLEROS_DATA,
      },
      'smart-invoice': {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...SMART_INVOICE_ARBITRATION_DATA,
      },
    },
  },
  [base.id]: {
    SUBGRAPH: getSubgraphUrl('smart-invoice-base', 'v0.0.3'),
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x4200000000000000000000000000000000000006',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xF9822818143948237A60A1a1CEFC85D6F1b929Df',
    ) as Address,
    RESOLVERS: {
      kleros: {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...KLEROS_DATA,
      },
      'smart-invoice': {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...SMART_INVOICE_ARBITRATION_DATA,
      },
    },
  },
  [holesky.id]: {
    SUBGRAPH: getSubgraphUrl('smart-invoice-holesky', 'v0.0.3'),
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x94373a4919B3240D86eA41593D5eBa789FEF3848',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xE0986c3bdAB537fBeb7c94D0C5EF961d6d8bf63a',
    ) as Address,
    RESOLVERS: {
      kleros: {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...KLEROS_DATA,
      },
      'smart-invoice': {
        address: SMART_INVOICE_ARBITRATION_SAFE,
        ...SMART_INVOICE_ARBITRATION_DATA,
      },
    },
  },
};

export const IPFS_ENDPOINT = 'https://gateway.pinata.cloud';

export const ARWEAVE_ENDPOINT = 'https://arweave.net';

export function isSupportedChainId(
  chainId: number | undefined,
): chainId is SupportedChainId {
  if (!chainId) return false;
  return chainId in NETWORK_CONFIG;
}

export const graphUrls = (chainId: SupportedChainId) =>
  NETWORK_CONFIG[chainId].SUBGRAPH;

export const resolvers = (
  chainId: SupportedChainId,
): Array<KnownResolverType> =>
  Object.keys(NETWORK_CONFIG[chainId].RESOLVERS) as Array<KnownResolverType>;

export const resolverInfo = (chainId: SupportedChainId) =>
  NETWORK_CONFIG[chainId].RESOLVERS;

export const wrappedNativeToken = (chainId: SupportedChainId) =>
  NETWORK_CONFIG[chainId].WRAPPED_NATIVE_TOKEN;

export const invoiceFactory = (chainId: SupportedChainId) =>
  NETWORK_CONFIG[chainId].INVOICE_FACTORY;

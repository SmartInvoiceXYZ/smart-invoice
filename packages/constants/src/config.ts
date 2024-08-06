import { toLower } from 'lodash';
import { Address } from 'viem';
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

const LEXDAO_LOGO = '/assets/lex-dao.png';

const LEXDAO_TERMS_URL =
  'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver';

const KLEROS_LOGO = '/assets/kleros.svg';
const KLEROS_TERMS_URL =
  'https://docs.google.com/document/d/1z_l2Wc8YHSspB0Lm5cmMDhu9h0W5G4thvDLqWRtuxbA/';

// @note: Kleros And Smart Invoice use the same safe address,
// but they are differentiated by case for frontend!
export const KLEROS_ARBITRATION_SAFE =
  '0x18542245cA523DFF96AF766047fE9423E0BED3C0';

export const SMART_INVOICE_ARBITRATION_SAFE = toLower(
  '0x18542245cA523DFF96AF766047fE9423E0BED3C0',
);

export const KLEROS_GOOGLE_FORM = 'https://forms.gle/K3oMAzAb32G5SbpM9';

const LEXDAO_DATA = {
  name: 'LexDAO',
  logoUrl: LEXDAO_LOGO,
  termsUrl: LEXDAO_TERMS_URL,
};

const KLEROS_DATA = {
  name: 'Kleros',
  disclaimer:
    'Only choose Kleros if total invoice value is greater than 1000 USD',
  logoUrl: KLEROS_LOGO,
  termsUrl: KLEROS_TERMS_URL,
};

const SMART_INVOICE_ARBITRATION_DATA = {
  name: 'Smart Invoice In-house',
  disclaimer:
    'Only choose Smart Invoice In-house if invoice value is less than 1000 USD',
  logoUrl: '/favicon.ico',
  termsUrl:
    'https://docs.smartinvoice.xyz/arbitration/smart-invoice-arbitration',
};

export const KLEROS_COURTS = [
  {
    id: 1,
    name: 'General Court',
    link: 'https://klerosboard.com/100/courts/0',
    jurors_drawn: 3,
    reward: '13 DAI/USDC per juror',
    safe_address: KLEROS_ARBITRATION_SAFE,
  },
  {
    id: 2,
    name: 'Solidity Court',
    link: 'https://klerosboard.com/100/courts/13',
    jurors_drawn: 2,
    reward: '30 DAI/USDC per juror',
    safe_address: KLEROS_ARBITRATION_SAFE,
  },
  {
    id: 3,
    name: 'Javascript Court',
    link: 'https://klerosboard.com/100/courts/14',
    jurors_drawn: 2,
    reward: '30 DAI/USDC per juror',
    safe_address: KLEROS_ARBITRATION_SAFE,
  },
];

export type Resolver = {
  name: string;
  logoUrl: string;
  disclaimer?: string;
  termsUrl: string;
};

export type NetworkConfig = {
  SUBGRAPH: string;
  WRAPPED_NATIVE_TOKEN: Address;
  INVOICE_FACTORY: Address;
  RESOLVERS: Record<Address, Resolver>;
};

export type Config = {
  INFURA_ID: string;
  IPFS_ENDPOINT: string;
  BOX_ENDPOINT: string;
  NETWORK_CONFIG: Record<number, NetworkConfig>;
};

const STUDIO_ID = '78711';
const STUDIO_URL = `https://api.studio.thegraph.com/query/${STUDIO_ID}`;

export const NETWORK_CONFIG: Record<number, NetworkConfig> = {
  [mainnet.id]: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice/v0.0.3`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0x5E14cF595e18F91170009946205f8BBa21b323ca',
    ) as Address,
    RESOLVERS: {
      [toLower('0x5B620676E28693fC14876b035b08CbB1B657dF38')]: LEXDAO_DATA,
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION_DATA,
    },
  },
  [gnosis.id]: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice-gnosis/v0.0.5`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xdDd96D43b0B2Ca179DCefA58e71798d0ce56c9c8',
    ) as Address,
    RESOLVERS: {
      [toLower('0x5B620676E28693fC14876b035b08CbB1B657dF38')]: LEXDAO_DATA,
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION_DATA,
    },
  },
  [polygon.id]: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice-polygon/v0.0.3`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0x6dcF61a9170419f30e065A43540aa3663b837342',
    ) as Address,
    RESOLVERS: {
      [toLower('0x5B620676E28693fC14876b035b08CbB1B657dF38')]: LEXDAO_DATA,
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION_DATA,
    },
  },
  [arbitrum.id]: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice-arbitrum/v0.0.3`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xb4CdeF4aa610C046864467592FaE456a58d3443a',
    ) as Address,
    RESOLVERS: {
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION_DATA,
    },
  },
  [optimism.id]: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice-optimism/v0.0.3`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x4200000000000000000000000000000000000006',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xF9822818143948237A60A1a1CEFC85D6F1b929Df',
    ) as Address,
    RESOLVERS: {
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION_DATA,
    },
  },
  [sepolia.id]: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice-sepolia/v0.0.3`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0x8227b9868e00B8eE951F17B480D369b84Cd17c20',
    ) as Address,
    RESOLVERS: {
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION_DATA,
    },
  },
  [base.id]: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice-base/v0.0.3`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x4200000000000000000000000000000000000006',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xF9822818143948237A60A1a1CEFC85D6F1b929Df',
    ) as Address,
    RESOLVERS: {
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION_DATA,
    },
  },
  [holesky.id]: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice-holesky/v0.0.3`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x94373a4919B3240D86eA41593D5eBa789FEF3848',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xE0986c3bdAB537fBeb7c94D0C5EF961d6d8bf63a',
    ) as Address,
    RESOLVERS: {
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION_DATA,
    },
  },
};

export const CONFIG: Config = {
  INFURA_ID: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID || '',
  IPFS_ENDPOINT: 'https://smart-invoice.infura-ipfs.io',
  BOX_ENDPOINT: 'https://ipfs.3box.io',
  NETWORK_CONFIG,
};

export type ChainId = keyof typeof NETWORK_CONFIG;

export function isOfTypeChainId(chainId: number): chainId is ChainId {
  return chainId in NETWORK_CONFIG;
}

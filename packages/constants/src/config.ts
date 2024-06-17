import { toLower } from 'lodash';
import { Address } from 'viem';

const LexDAOLogo = '/assets/lex-dao.png';
const LEXDAO_TERMS_URL =
  'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver';

const LEXDAO_DATA = {
  name: 'LexDAO',
  logoUrl: LexDAOLogo,
  termsUrl: LEXDAO_TERMS_URL,
};

export type Resolver = {
  name: string;
  logoUrl: string;
  termsUrl: string;
};

export type NetworkConfig = {
  SUBGRAPH: string;
  WRAPPED_NATIVE_TOKEN: Address;
  INVOICE_FACTORY: Address;
  RESOLVERS: Record<Address, Resolver>;
};

interface Config {
  INFURA_ID: string;
  IPFS_ENDPOINT: string;
  BOX_ENDPOINT: string;
  NETWORK_CONFIG: Record<number, NetworkConfig>;
}

const STUDIO_ID = '78711';
const STUDIO_URL = `https://api.studio.thegraph.com/query/${STUDIO_ID}`;

export const NETWORK_CONFIG: Record<number, NetworkConfig> = {
  1: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice/v0.0.1`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0x5E14cF595e18F91170009946205f8BBa21b323ca',
    ) as Address,
    RESOLVERS: {
      [toLower('0x5B620676E28693fC14876b035b08CbB1B657dF38')]: LEXDAO_DATA,
    },
  },
  100: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice-gnosis/v0.0.1`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0xdDd96D43b0B2Ca179DCefA58e71798d0ce56c9c8',
    ) as Address,
    RESOLVERS: {
      [toLower('0x153Fbf5da827903e030Dc317C4031755D74D508a')]: LEXDAO_DATA,
    },
  },
  137: {
    SUBGRAPH: `${STUDIO_URL}/smart-invoice-polygon/v0.0.1`,
    WRAPPED_NATIVE_TOKEN: toLower(
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    ) as Address,
    INVOICE_FACTORY: toLower(
      '0x6dcF61a9170419f30e065A43540aa3663b837342',
    ) as Address,
    RESOLVERS: {
      [toLower('0xf8DBd458f841424e2fD5fBDf18A7dEA17eb2211D')]: LEXDAO_DATA,
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

import _, { toLower } from 'lodash';
import { Address } from 'viem';

const LexDAOLogo = '/assets/lex-dao.png';
const LEXDAO_TERMS_URL =
  'https://github.com/lexDAO/Arbitration/blob/master/rules/ToU.md#lexdao-resolver';

const KlerosLogo = '/assets/kleros.svg'; // todo: update this
const KLEROS_TERMS_URL = 'https://kleros.io/terms-of-service/'; // todo: update this

// @note: Kleros And Smart Invoice use the same safe address,
// but they are differentiated by case for frontend!
export const KLEROS_ARBITRATION_SAFE =
  '0x18542245cA523DFF96AF766047fE9423E0BED3C0';

export const SMART_INVOICE_ARBITRATION_SAFE = toLower(
  '0x18542245cA523DFF96AF766047fE9423E0BED3C0',
);

const LEXDAO_DATA = {
  name: 'LexDAO',
  logoUrl: LexDAOLogo,
  termsUrl: LEXDAO_TERMS_URL,
};

const KLEROS_DATA = {
  name: 'Kleros',
  logoUrl: KlerosLogo,
  termsUrl: KLEROS_TERMS_URL,
};

const SMART_INVOICE_ARBITRATION = {
  name: 'Smart Invoice',
  logoUrl: '/favicon.ico',
  termsUrl: 'https://github.com/smart-invoice/smart-invoice/blob/main/LICENSE', // todo: update this
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
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION,
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
      [toLower('0x5B620676E28693fC14876b035b08CbB1B657dF38')]: LEXDAO_DATA,
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION,
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
      [toLower('0x5B620676E28693fC14876b035b08CbB1B657dF38')]: LEXDAO_DATA,
      [KLEROS_ARBITRATION_SAFE]: KLEROS_DATA,
      [toLower(SMART_INVOICE_ARBITRATION_SAFE)]: SMART_INVOICE_ARBITRATION,
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

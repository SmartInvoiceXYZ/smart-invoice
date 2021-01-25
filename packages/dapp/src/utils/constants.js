export const NETWORK = 4;

// rinkeby
export const ADDRESSES = {
  // TODO: change this to an actual valid lex_dao address
  LEX_DAO: '0x1206b51217271FC3ffCa57d0678121983ce0390E'.toLowerCase(),
  ARAGON_COURT: '0x52180af656a1923024d1accf1d827ab85ce48878'.toLowerCase(),
  DAI_TOKEN: '0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42'.toLowerCase(),
  WETH_TOKEN: '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase(),
  FACTORY: '0xaf0aDaCf88ffeACB1d76cB41B139b6359192C50d'.toLowerCase(),
};

export const GRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/dan13ram/rinkeby-smart-invoices';

export const NAV_ITEMS = [
  {
    name: 'Home',
    link: '/',
  },
  {
    name: 'FAQ',
    link: '/faq',
  },
];

export const STEPS = {
  1: {
    step_title: 'Project Details',
    step_details: [
      'Note: All invoice data will be stored on-chain and can be viewed by anyone.',
      'If you have privacy concerns, we recommend taking care to add permissions to your project agreement document.',
      'Character Count will effect gas cost.',
    ],
    next: 'payment details',
  },
  2: {
    step_title: 'Payment Details',
    step_details: [],
    next: 'set payment amounts',
  },
  3: {
    step_title: 'Payment Chunks',
    step_details: [],
    next: 'confirmation',
  },
  4: {
    step_title: 'Confirmation',
    step_details: [],
    next: 'register invoice escrow',
  },
};

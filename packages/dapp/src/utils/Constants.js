export const chain_id = 4;

// rinkeby
export const lex_dao = '0x1206b51217271FC3ffCa57d0678121983ce0390E'.toLowerCase(); //TODO: change this to an actual valid lex_dao address
export const aragon_court = '0x52180af656a1923024d1accf1d827ab85ce48878'.toLowerCase();
export const dai_token = '0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42'.toLowerCase();
export const weth_token = '0xc778417E063141139Fce010982780140Aa0cD5Ab'.toLowerCase();
export const smart_invoices_factory = '0x91E12d41314b73c64f6C8476d2C36A64995C7022'.toLowerCase();

// kovan

export const graph_url =
  'https://api.thegraph.com/subgraphs/name/dan13ram/rinkeby-smart-invoices';

export const nav_items = [
  {
    name: 'Home',
    link: '/',
  },
  // {
  //   name: 'How it Works',
  //   link: '',
  // },
  {
    name: 'FAQ',
    link: '/faq',
  },
];

export const steps = {
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

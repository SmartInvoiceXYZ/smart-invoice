// rinkeby
export const lex_dao = '0x3F9B2fea60325d733e61bC76598725c5430cD751'; //TODO: change this to an actual valid lex_dao address
export const aragon_court = '0x52180af656a1923024d1accf1d827ab85ce48878';
export const dai_token = '0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42';
export const weth_token = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
export const smart_invoices_mono = '0xd09Fdad24DE8C4CE3C65be5eeBFE841ecd24220B';

// kovan
// export const smart_invoices_mono = '0xCE0cD015664Da65c237556025825310641FfC8FF';

export const graph_url =
  'https://api.thegraph.com/subgraphs/name/raid-guild/rinkeby-smart-invoices-mono';

export const nav_items = [
  {
    name: 'How it Works',
    link: '',
  },
  {
    name: 'FAQ',
    link: '',
  },
  {
    name: 'Home',
    link: '',
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
